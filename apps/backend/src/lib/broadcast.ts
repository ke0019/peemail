import type { Server } from 'socket.io';
import { getNearbyRooms } from './geo.js';
import type {
  PinObject,
  WsPinNew,
  WsPinExpired,
  WsPinVoteUpdated,
  WsPinHidden,
} from '@peemail/shared';

let _io: Server | null = null;

export function initBroadcast(io: Server): void {
  _io = io;
}

function pinsNs() {
  return _io?.of('/pins') ?? null;
}

export function broadcastPinNew(lat: number, lng: number, pin: PinObject): void {
  const payload: WsPinNew = { pin };
  getNearbyRooms(lat, lng).forEach((room) =>
    pinsNs()?.to(room).emit('pin:new', payload),
  );
}

export function broadcastPinExpired(lat: number, lng: number, pinId: string): void {
  const payload: WsPinExpired = { pinId };
  getNearbyRooms(lat, lng).forEach((room) =>
    pinsNs()?.to(room).emit('pin:expired', payload),
  );
}

export function broadcastPinVoteUpdated(
  lat: number,
  lng: number,
  data: WsPinVoteUpdated,
): void {
  getNearbyRooms(lat, lng).forEach((room) =>
    pinsNs()?.to(room).emit('pin:vote_updated', data),
  );
}

export function broadcastPinHidden(lat: number, lng: number, pinId: string): void {
  const payload: WsPinHidden = { pinId };
  getNearbyRooms(lat, lng).forEach((room) =>
    pinsNs()?.to(room).emit('pin:hidden', payload),
  );
}
