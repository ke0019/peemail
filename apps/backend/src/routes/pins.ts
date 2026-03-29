import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql, eq, and } from 'drizzle-orm';
import { pins, devices, blocks } from '@peemail/db';
import {
  PIN_DEFAULT_TTL_MS,
  PIN_MAX_CONTENT_LENGTH,
  VIEW_DEDUP_TTL_SECONDS,
  type PinObject,
  type AnimalId,
  type AvatarColor,
} from '@peemail/shared';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../lib/db.js';
import { redis } from '../lib/redis.js';
import { pinExpireQueue } from '../lib/queue.js';
import { broadcastPinNew } from '../lib/broadcast.js';

const route = new Hono();

// ── 共用类型 ────────────────────────────────────────────────────────────────

interface PinRow {
  id: string;
  content: string;
  is_private: boolean;
  expires_at: Date | null;
  view_count: number;
  vote_up_count: number;
  vote_down_count: number;
  pin_type: string;
  created_at: Date;
  lat: number;
  lng: number;
  nickname: string;
  avatar_animal: string;
  avatar_color: string;
  reply_count: number;
  my_vote: number | null;
}

function formatPin(row: PinRow): PinObject {
  return {
    id: row.id,
    content: row.content,
    author: {
      nickname: row.nickname,
      avatarAnimal: row.avatar_animal as AnimalId,
      avatarColor: row.avatar_color as AvatarColor,
    },
    location: { lat: Number(row.lat), lng: Number(row.lng) },
    viewCount: row.view_count,
    voteUpCount: row.vote_up_count,
    voteDownCount: row.vote_down_count,
    myVote: (row.my_vote as 1 | -1 | null) ?? null,
    replyCount: Number(row.reply_count),
    expiresAt: row.expires_at?.toISOString() ?? null,
    isPrivate: row.is_private,
    pinType: row.pin_type as 'user' | 'official',
    createdAt: row.created_at.toISOString(),
  };
}

// ── GET /pins ───────────────────────────────────────────────────────────────

const getPinsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  type: z.enum(['public', 'private']).default('public'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

route.get('/', authMiddleware, zValidator('query', getPinsSchema), async (c) => {
  const { lat, lng, type, cursor, limit } = c.req.valid('query');
  const { deviceId } = c.var.device;

  const cursorTs = cursor ? new Date(cursor) : null;

  // ── 嗅一嗅：PostGIS ST_DWithin 50m 空间查询 ─────────────────────────────
  // 私密钉：仅本人可见，不受 expires_at 限制
  // 公开钉：未过期 + 未隐藏 + 排除屏蔽用户
  const rows = await db.execute<PinRow>(sql`
    SELECT
      p.id,
      p.content,
      p.is_private,
      p.expires_at,
      p.view_count,
      p.vote_up_count,
      p.vote_down_count,
      p.pin_type,
      p.created_at,
      ST_Y(p.location::geometry)  AS lat,
      ST_X(p.location::geometry)  AS lng,
      d.nickname,
      d.avatar_animal,
      d.avatar_color,
      CAST(COUNT(DISTINCT r.id) AS INT) AS reply_count,
      v.value                     AS my_vote
    FROM pins p
    INNER JOIN devices d ON d.id = p.device_id
    LEFT  JOIN replies r ON r.pin_id = p.id
    LEFT  JOIN votes   v ON v.pin_id = p.id AND v.device_id = ${deviceId}::uuid
    WHERE
      ST_DWithin(
        p.location::geography,
        ST_MakePoint(${lng}, ${lat})::geography,
        50
      )
      AND p.is_hidden = false
      AND (
        ${type === 'private'
          ? sql`p.is_private = true AND p.device_id = ${deviceId}::uuid`
          : sql`p.is_private = false
                AND p.expires_at > NOW()
                AND p.device_id NOT IN (
                  SELECT blocked_device_id
                  FROM   blocks
                  WHERE  blocker_device_id = ${deviceId}::uuid
                )`
        }
      )
      ${cursorTs ? sql`AND p.created_at < ${cursorTs}` : sql``}
    GROUP BY p.id, d.id, v.value
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  `);

  const pinList = (rows as unknown as PinRow[]).map(formatPin);
  const nextCursor =
    pinList.length === limit
      ? pinList[pinList.length - 1].createdAt
      : null;

  return c.json({ pins: pinList, nextCursor });
});

// ── POST /pins ──────────────────────────────────────────────────────────────

const createPinSchema = z.object({
  content: z.string().min(1).max(PIN_MAX_CONTENT_LENGTH),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isPrivate: z.boolean().default(false),
});

route.post('/', authMiddleware, zValidator('json', createPinSchema), async (c) => {
  const { content, lat, lng, isPrivate } = c.req.valid('json');
  const { deviceId } = c.var.device;

  // ── 检查是否在活动场馆范围内，决定公开钉的 TTL ───────────────────────────
  let ttlMs = PIN_DEFAULT_TTL_MS;
  let eventId: string | null = null;

  if (!isPrivate) {
    const eventRows = await db.execute<{ id: string; personal_pin_ttl: number }>(sql`
      SELECT id, personal_pin_ttl
      FROM events
      WHERE status = 'active'
        AND ST_Within(
          ST_MakePoint(${lng}, ${lat})::geography::geometry,
          venue_boundary::geometry
        )
      LIMIT 1
    `);
    if ((eventRows as unknown as Array<{ id: string; personal_pin_ttl: number }>).length > 0) {
      const ev = (eventRows as unknown as Array<{ id: string; personal_pin_ttl: number }>)[0];
      ttlMs = ev.personal_pin_ttl * 1000;
      eventId = ev.id;
    }
  }

  const expiresAt = isPrivate ? null : new Date(Date.now() + ttlMs);

  // ── 插入气味钉 ────────────────────────────────────────────────────────────
  const [newPin] = await db
    .insert(pins)
    .values({
      deviceId,
      content,
      location: { lat, lng },
      isPrivate,
      expiresAt,
      pinType: 'user',
      ...(eventId ? { eventId } : {}),
    })
    .returning();

  // ── 查询作者信息（用于响应和广播）────────────────────────────────────────
  const [author] = await db
    .select({
      nickname: devices.nickname,
      avatarAnimal: devices.avatarAnimal,
      avatarColor: devices.avatarColor,
    })
    .from(devices)
    .where(eq(devices.id, deviceId))
    .limit(1);

  if (!author) throw new HTTPException(500, { message: 'Author not found' });

  const pinObject: PinObject = {
    id: newPin.id,
    content: newPin.content,
    author: {
      nickname: author.nickname,
      avatarAnimal: author.avatarAnimal as AnimalId,
      avatarColor: author.avatarColor as AvatarColor,
    },
    location: { lat, lng },
    viewCount: 0,
    voteUpCount: 0,
    voteDownCount: 0,
    myVote: null,
    replyCount: 0,
    expiresAt: expiresAt?.toISOString() ?? null,
    isPrivate,
    pinType: 'user',
    createdAt: newPin.createdAt.toISOString(),
  };

  // ── 公开钉：入 BullMQ 延迟队列（到期自动处理）────────────────────────────
  if (!isPrivate && expiresAt) {
    const delay = expiresAt.getTime() - Date.now();
    await pinExpireQueue.add(
      'expire',
      { pinId: newPin.id, lat, lng },
      { delay, jobId: `pin:${newPin.id}` },
    );
  }

  // ── 公开钉：Socket.io 广播 pin:new 给附近客户端 ───────────────────────────
  if (!isPrivate) {
    broadcastPinNew(lat, lng, pinObject);
  }

  return c.json({ pin: pinObject }, 201);
});

// ── DELETE /pins/:id ────────────────────────────────────────────────────────

route.delete('/:id', authMiddleware, async (c) => {
  const pinId = c.req.param('id');
  const { deviceId } = c.var.device;

  const [deleted] = await db
    .select({ id: pins.id })
    .from(pins)
    .where(and(eq(pins.id, pinId), eq(pins.deviceId, deviceId)))
    .limit(1);

  if (!deleted) throw new HTTPException(404, { message: 'Pin not found or not yours' });

  await db.delete(pins).where(eq(pins.id, pinId));

  // 取消待执行的到期任务
  await pinExpireQueue.remove(`pin:${pinId}`);

  return c.body(null, 204);
});

// ── POST /pins/:id/view — 闻过（幂等，同设备 1h 内不重复计数）──────────────

route.post('/:id/view', authMiddleware, async (c) => {
  const pinId = c.req.param('id');
  const { deviceId } = c.var.device;

  const dedupKey = `view:${deviceId}:${pinId}`;
  const alreadyViewed = await redis.get(dedupKey);

  if (!alreadyViewed) {
    await Promise.all([
      db.execute(sql`
        UPDATE pins SET view_count = view_count + 1
        WHERE id = ${pinId}::uuid AND is_hidden = false
      `),
      redis.set(dedupKey, '1', 'EX', VIEW_DEDUP_TTL_SECONDS),
    ]);
  }

  const [row] = await db
    .select({ viewCount: pins.viewCount })
    .from(pins)
    .where(eq(pins.id, pinId))
    .limit(1);

  if (!row) throw new HTTPException(404, { message: 'Pin not found' });

  return c.json({ viewCount: row.viewCount });
});

export default route;
