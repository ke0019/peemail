import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

/** 通用 Redis 客户端（SET/GET/INCR 等） */
export const redis = new Redis(REDIS_URL);

/**
 * 创建 BullMQ 专用连接
 * BullMQ 的阻塞命令要求 maxRetriesPerRequest: null，
 * Queue / Worker 各自持有独立实例
 */
export function createBullMQConnection(): Redis {
  return new Redis(REDIS_URL, { maxRetriesPerRequest: null });
}
