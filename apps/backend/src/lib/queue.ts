import { Queue } from 'bullmq';
import { createBullMQConnection } from './redis.js';

export interface PinExpireJob {
  pinId: string;
  lat: number;
  lng: number;
}

/**
 * pin-expire 队列
 * 创建公开气味钉时加入一条延迟任务，到期后 Worker 触发过期处理
 */
export const pinExpireQueue = new Queue<PinExpireJob>('pin-expire', {
  connection: createBullMQConnection(),
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});
