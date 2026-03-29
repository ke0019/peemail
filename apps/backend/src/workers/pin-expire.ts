import { Worker } from 'bullmq';
import { eq, sql } from 'drizzle-orm';
import { pins } from '@peemail/db';
import { createBullMQConnection } from '../lib/redis.js';
import { db } from '../lib/db.js';
import { broadcastPinExpired } from '../lib/broadcast.js';
import type { PinExpireJob } from '../lib/queue.js';

/**
 * pin-expire Worker
 *
 * 当公开气味钉到期时执行：
 * 1. 确认 pin 仍存在且尚未隐藏
 * 2. 活动场景处理（archive 流程，Phase 2）暂跳过
 * 3. 删除气味钉
 * 4. 通过 Socket.io 广播 pin:expired 给附近客户端
 */
export function startPinExpireWorker(): Worker<PinExpireJob> {
  const worker = new Worker<PinExpireJob>(
    'pin-expire',
    async (job) => {
      const { pinId, lat, lng } = job.data;

      // 查 pin 是否仍存在（可能已被用户主动删除）
      const [pin] = await db
        .select({ id: pins.id, eventId: pins.eventId })
        .from(pins)
        .where(eq(pins.id, pinId))
        .limit(1);

      if (!pin) return; // 已删除，跳过

      // TODO Phase 2：若 pin.eventId 存在，走活动场景归档流程
      //   1. 查找 official_pin
      //   2. INSERT INTO archived_pin_contents
      //   3. DELETE pin

      // 删除气味钉
      await db.delete(pins).where(eq(pins.id, pinId));

      // 广播 pin:expired 给附近客户端
      broadcastPinExpired(lat, lng, pinId);
    },
    {
      connection: createBullMQConnection(),
      concurrency: 10,
    },
  );

  worker.on('failed', (job, err) => {
    console.error(`[pin-expire] job ${job?.id} failed:`, err);
  });

  return worker;
}
