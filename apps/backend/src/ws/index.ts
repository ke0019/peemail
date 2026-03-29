import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { getGeoRoom } from '../lib/geo.js';
import { initBroadcast } from '../lib/broadcast.js';
import type { WsJoinArea } from '@peemail/shared';

export function createWebSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? '*',
      methods: ['GET', 'POST'],
    },
  });

  // 注册广播助手，供路由层调用
  initBroadcast(io);

  // ── Namespace /pins — 地图留言板实时推送（MVP）────────────────────────────
  //
  // 事件（Client → Server）：
  //   join_area   : 订阅当前坐标的 geo-hash 房间
  //   leave_area  : 离开当前区域
  //
  // 事件（Server → Client）：
  //   pin:new          : 附近新增气味钉
  //   pin:expired      : 气味钉过期消失
  //   pin:vote_updated : 表态数变化
  //   pin:hidden       : 气味钉因举报被自动隐藏
  const pinsNs = io.of('/pins');

  pinsNs.on('connection', (socket) => {
    let currentRoom: string | null = null;

    socket.on('join_area', (payload: WsJoinArea) => {
      const { lat, lng } = payload;

      // 离开旧房间
      if (currentRoom) socket.leave(currentRoom);

      // 进入新房间
      currentRoom = getGeoRoom(lat, lng);
      socket.join(currentRoom);
    });

    socket.on('leave_area', () => {
      if (currentRoom) {
        socket.leave(currentRoom);
        currentRoom = null;
      }
    });

    socket.on('disconnect', () => {
      // ioredis 在线状态清理（Phase 2 需要时在此添加）
      currentRoom = null;
    });
  });

  // ── Namespace /motion — 行进模式（Phase 2，占位）──────────────────────────
  io.of('/motion').on('connection', (_socket) => {
    // Phase 2 实现
  });

  return io;
}
