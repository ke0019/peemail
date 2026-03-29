import { Hono } from 'hono';

const events = new Hono();

/**
 * GET /events?lat=&lng= — 查询当前坐标是否在活动场地范围内
 */
events.get('/', async (c) => {
  // TODO: PostGIS ST_Within 查询 events.venue_boundary
  // TODO: 若在活动范围内，返回 event 信息和官方气味钉
  return c.json({ event: null });
});

export default events;
