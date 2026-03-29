import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createDb, devices } from '@peemail/db';
import { randomNickname, randomAvatarColor } from '@peemail/shared';
import { signDeviceToken } from '../lib/jwt.js';
import { authMiddleware } from '../middleware/auth.js';

const route = new Hono();

const db = createDb(process.env.DATABASE_URL!);

// ── POST /devices/register ──────────────────────────────────────────────────

const registerSchema = z.object({
  deviceHash: z.string().min(64).max(64),
  identityKeyHash: z.string().min(64).max(64),
});

route.post('/register', zValidator('json', registerSchema), async (c) => {
  const { deviceHash, identityKeyHash } = c.req.valid('json');

  // 若已注册（同一 deviceHash），直接签发新 token
  const existing = await db
    .select()
    .from(devices)
    .where(eq(devices.deviceHash, deviceHash))
    .limit(1);

  if (existing.length > 0) {
    const device = existing[0];
    const token = await signDeviceToken(device.id);
    return c.json({
      token,
      device: {
        id: device.id,
        nickname: device.nickname,
        avatarAnimal: device.avatarAnimal,
        avatarColor: device.avatarColor,
      },
    });
  }

  const { nickname, avatarAnimal } = randomNickname();
  const avatarColor = randomAvatarColor();

  const [device] = await db
    .insert(devices)
    .values({ deviceHash, identityKeyHash, nickname, avatarAnimal, avatarColor })
    .returning();

  const token = await signDeviceToken(device.id);

  return c.json(
    {
      token,
      device: {
        id: device.id,
        nickname: device.nickname,
        avatarAnimal: device.avatarAnimal,
        avatarColor: device.avatarColor,
      },
    },
    201,
  );
});

// ── POST /devices/recover ───────────────────────────────────────────────────

const recoverSchema = z.object({
  identityKeyHash: z.string().min(64).max(64),
  newDeviceHash: z.string().min(64).max(64),
});

route.post('/recover', zValidator('json', recoverSchema), async (c) => {
  const { identityKeyHash, newDeviceHash } = c.req.valid('json');

  const existing = await db
    .select()
    .from(devices)
    .where(eq(devices.identityKeyHash, identityKeyHash))
    .limit(1);

  if (existing.length === 0) {
    return c.json({ message: 'Identity not found' }, 404);
  }

  const device = existing[0];

  // 更新 deviceHash 绑定到新设备
  const [updated] = await db
    .update(devices)
    .set({ deviceHash: newDeviceHash, lastSeenAt: new Date() })
    .where(eq(devices.id, device.id))
    .returning();

  const token = await signDeviceToken(updated.id);

  return c.json({
    token,
    device: {
      id: updated.id,
      nickname: updated.nickname,
      avatarAnimal: updated.avatarAnimal,
      avatarColor: updated.avatarColor,
    },
  });
});

// ── PATCH /devices/me ───────────────────────────────────────────────────────

const updateSchema = z.object({
  nickname: z.string().min(1).max(20).optional(),
  avatarColor: z
    .enum(['#A8D8A8', '#F9C784', '#FF8C69', '#87CEEB', '#DDA0DD'])
    .optional(),
});

route.patch('/me', authMiddleware, zValidator('json', updateSchema), async (c) => {
  const { nickname, avatarColor } = c.req.valid('json');
  const { deviceId } = c.var.device;

  const [updated] = await db
    .update(devices)
    .set({
      ...(nickname && { nickname }),
      ...(avatarColor && { avatarColor }),
      lastSeenAt: new Date(),
    })
    .where(eq(devices.id, deviceId))
    .returning();

  return c.json({
    device: {
      id: updated.id,
      nickname: updated.nickname,
      avatarAnimal: updated.avatarAnimal,
      avatarColor: updated.avatarColor,
    },
  });
});

export default route;
