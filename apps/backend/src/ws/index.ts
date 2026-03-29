import { Server } from 'socket.io';
import type { HttpServer } from '@hono/node-server';

export function createWebSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? '*',
      methods: ['GET', 'POST'],
    },
  });

  /**
   * Namespace: /pins — 地图留言板实时推送（MVP）
   *
   * 事件：
   *   join_area   → Client 订阅当前坐标区域
   *   leave_area  → Client 离开当前区域
   *   pin:new     ← Server 附近新增气味钉
   *   pin:expired ← Server 气味钉过期消失
   *   pin:vote_updated ← Server 表态数变化
   *   pin:hidden  ← Server 气味钉因举报被隐藏
   */
  const pinsNs = io.of('/pins');

  pinsNs.on('connection', (socket) => {
    socket.on('join_area', (_payload: { lat: number; lng: number }) => {
      // TODO: 根据坐标划分 geo-hash 房间，socket.join(roomKey)
    });

    socket.on('leave_area', () => {
      // TODO: socket.leave 所有地理房间
    });

    socket.on('disconnect', () => {
      // TODO: 清理在线状态 Redis key
    });
  });

  /**
   * Namespace: /motion — 行进模式（Phase 2，占位）
   */
  io.of('/motion').on('connection', (_socket) => {
    // Phase 2 实现
  });

  return io;
}
