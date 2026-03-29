import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { verifyDeviceToken, type DeviceTokenPayload } from '../lib/jwt.js';

type Env = {
  Variables: {
    device: DeviceTokenPayload;
  };
};

/**
 * JWT 认证中间件
 * 从 X-Device-Token header 中提取并验证 JWT，
 * 验证通过后将 payload 挂载到 c.var.device
 */
export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const token = c.req.header('X-Device-Token');
  if (!token) {
    throw new HTTPException(401, { message: 'Missing X-Device-Token header' });
  }
  try {
    const payload = await verifyDeviceToken(token);
    c.set('device', payload);
    await next();
  } catch {
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }
});
