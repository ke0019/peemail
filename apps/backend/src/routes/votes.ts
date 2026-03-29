import { Hono } from 'hono';

const votes = new Hono();

/**
 * PUT /pins/:id/vote — 气味相投 / 臭味相投 / 撤销
 * value: 1=气味相投, -1=臭味相投, 0=撤销
 */
votes.put('/:id/vote', async (c) => {
  // TODO: 校验 JWT
  // TODO: UPSERT votes 表（每设备每钉只能有一票）
  // TODO: 更新 pins.vote_up_count / vote_down_count
  // TODO: 通过 Socket.io 广播 pin:vote_updated
  return c.json({ message: 'not implemented' }, 501);
});

export default votes;
