import { Hono } from 'hono';

const replies = new Hono();

/**
 * GET /pins/:id/replies?cursor=&limit= — 获取留言串
 */
replies.get('/:id/replies', async (c) => {
  // TODO: 分页查询 replies 表，支持二级嵌套
  return c.json({ replies: [], next_cursor: null });
});

/**
 * POST /pins/:id/replies — 发布回复
 */
replies.post('/:id/replies', async (c) => {
  // TODO: 校验 JWT，验证 content 长度 <= 280
  // TODO: 插入 replies 表
  // TODO: 触发互动续命（BullMQ 延迟任务更新 pins.expires_at，Phase 2）
  return c.json({ message: 'not implemented' }, 501);
});

export default replies;
