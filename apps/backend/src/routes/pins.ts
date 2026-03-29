import { Hono } from 'hono';

const pins = new Hono();

/**
 * GET /pins?lat=&lng=&type=public|private&cursor=&limit=
 * 查询 50m 范围内的气味钉（嗅一嗅）
 */
pins.get('/', async (c) => {
  // TODO: 解析 lat/lng/type/cursor/limit
  // TODO: PostGIS ST_DWithin 查询，过滤 is_hidden=false 和过期钉
  // TODO: 排除屏蔽列表中的设备
  return c.json({ pins: [], next_cursor: null });
});

/**
 * POST /pins — 发布气味钉（留个味儿）
 */
pins.post('/', async (c) => {
  // TODO: 校验 JWT，验证 content 长度 <= 280
  // TODO: 判断是否在活动场地内（查 events 表），设置对应 TTL
  // TODO: 公开钉写入 BullMQ 延迟任务（到期清理）
  // TODO: 通过 Socket.io 向附近客户端广播 pin:new
  return c.json({ message: 'not implemented' }, 501);
});

/**
 * DELETE /pins/:id — 删除自己的气味钉
 */
pins.delete('/:id', async (c) => {
  // TODO: 校验 JWT，确认 device_id 匹配
  return c.body(null, 204);
});

/**
 * POST /pins/:id/view — 闻过（浏览计数，幂等：同设备 1h 内不重复计数）
 */
pins.post('/:id/view', async (c) => {
  // TODO: Redis 临时标记 view:{device_id}:{pin_id}，TTL 1h
  // TODO: 更新 pins.view_count
  return c.json({ view_count: 0 });
});

export default pins;
