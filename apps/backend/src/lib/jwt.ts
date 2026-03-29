import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { JWT_EXPIRES_IN } from '@peemail/shared';

export interface DeviceTokenPayload extends JWTPayload {
  deviceId: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function signDeviceToken(deviceId: string): Promise<string> {
  return new SignJWT({ deviceId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getSecret());
}

export async function verifyDeviceToken(token: string): Promise<DeviceTokenPayload> {
  const { payload } = await jwtVerify<DeviceTokenPayload>(token, getSecret());
  return payload;
}
