import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import devicesRoute from './routes/devices.js';
import pinsRoute from './routes/pins.js';
import votesRoute from './routes/votes.js';
import repliesRoute from './routes/replies.js';
import reportsRoute from './routes/reports.js';
import eventsRoute from './routes/events.js';
import { createWebSocketServer } from './ws/index.js';
import { startPinExpireWorker } from './workers/pin-expire.js';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({ origin: process.env.CORS_ORIGIN ?? '*' }));

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'peemail-api' }));

// API v1
const v1 = new Hono();
v1.route('/devices', devicesRoute);
v1.route('/pins', pinsRoute);
v1.route('/pins', votesRoute);
v1.route('/pins', repliesRoute);
v1.route('/reports', reportsRoute);
v1.route('/events', eventsRoute);

app.route('/api/v1', v1);

const port = Number(process.env.PORT) || 3000;

const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`Peemail API   → http://localhost:${port}`);
  console.log(`WebSocket     → ws://localhost:${port}`);
});

// 挂载 Socket.io（同进程，共享 HTTP server）
createWebSocketServer(server as Parameters<typeof createWebSocketServer>[0]);

// 启动 BullMQ Worker
startPinExpireWorker();
console.log('BullMQ worker → pin-expire [started]');
