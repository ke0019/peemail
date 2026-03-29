import { Hono } from 'hono';

const reports = new Hono();

/**
 * POST /reports — 举报气味钉或回复
 * 累计达到阈值（REPORT_HIDE_THRESHOLD，默认 3）后自动隐藏 + Socket.io 广播 pin:hidden
 */
reports.post('/', async (c) => {
  // TODO: 校验 JWT
  // TODO: 插入 reports 表
  // TODO: 更新 pins.report_count
  // TODO: 检查是否达到阈值，若达到：设 is_hidden=true，广播 pin:hidden
  return c.json({ message: 'not implemented' }, 501);
});

/**
 * POST /blocks — 屏蔽某只动物
 */
reports.post('/blocks', async (c) => {
  // TODO: 校验 JWT
  // TODO: 插入 blocks 表（UPSERT 避免重复）
  return c.body(null, 201);
});

export default reports;
