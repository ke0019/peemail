import type { AnimalId, AvatarColor } from '../animals.js';

// ── 设备身份 ───────────────────────────────────────────

export interface DeviceProfile {
  id: string;
  nickname: string;
  avatarAnimal: AnimalId;
  avatarColor: AvatarColor;
}

export interface RegisterDeviceRequest {
  /** SHA-256(设备唯一标识) */
  deviceHash: string;
  /** SHA-256(恢复码派生主密钥)；服务端只存 hash，无法反推恢复码 */
  identityKeyHash: string;
}

export interface RegisterDeviceResponse {
  token: string;
  device: DeviceProfile;
}

export interface RecoverDeviceRequest {
  /** 客户端用恢复码重新派生的 identity_key_hash */
  identityKeyHash: string;
  newDeviceHash: string;
}

export type RecoverDeviceResponse = RegisterDeviceResponse;

export interface UpdateDeviceRequest {
  nickname?: string;
  avatarColor?: AvatarColor;
}

// ── 气味钉 ─────────────────────────────────────────────

export type PinType = 'user' | 'official';

export interface PinAuthor {
  nickname: string;
  avatarAnimal: AnimalId;
  avatarColor: AvatarColor;
}

export interface PinObject {
  id: string;
  content: string;
  author: PinAuthor;
  location: { lat: number; lng: number };
  viewCount: number;
  voteUpCount: number;
  voteDownCount: number;
  /** 1 | -1 | null */
  myVote: 1 | -1 | null;
  replyCount: number;
  /** 私密钉为 null */
  expiresAt: string | null;
  isPrivate: boolean;
  pinType: PinType;
  createdAt: string;
}

export interface GetPinsQuery {
  lat: number;
  lng: number;
  type: 'public' | 'private';
  cursor?: string;
  limit?: number;
}

export interface GetPinsResponse {
  pins: PinObject[];
  nextCursor: string | null;
}

export interface CreatePinRequest {
  content: string;
  lat: number;
  lng: number;
  isPrivate: boolean;
}

export interface CreatePinResponse {
  pin: PinObject;
}

// ── 表态 ───────────────────────────────────────────────

export interface VoteRequest {
  /** 1=气味相投, -1=臭味相投, 0=撤销 */
  value: 1 | -1 | 0;
}

export interface VoteResponse {
  voteUpCount: number;
  voteDownCount: number;
  myVote: 1 | -1 | null;
}

// ── 闻过 ───────────────────────────────────────────────

export interface ViewResponse {
  viewCount: number;
}

// ── 回复 ───────────────────────────────────────────────

export interface ReplyObject {
  id: string;
  content: string;
  author: PinAuthor;
  parentId: string | null;
  createdAt: string;
}

export interface GetRepliesResponse {
  replies: ReplyObject[];
  nextCursor: string | null;
}

export interface CreateReplyRequest {
  content: string;
  parentId?: string | null;
}

export interface CreateReplyResponse {
  reply: ReplyObject;
}

// ── 举报 / 屏蔽 ────────────────────────────────────────

export type ReportReason = 'spam' | 'offensive' | 'misleading' | 'other';

export interface CreateReportRequest {
  pinId?: string;
  replyId?: string;
  reason: ReportReason;
}

export interface CreateReportResponse {
  reportId: string;
}

export interface BlockDeviceRequest {
  deviceId: string;
}

// ── 活动场景 ────────────────────────────────────────────

export interface EventObject {
  id: string;
  name: string;
  status: 'active' | 'hidden';
  personalPinTtl: number;
  officialPins: PinObject[];
}

export interface GetEventResponse {
  event: EventObject | null;
}

// ── WebSocket 事件 payload ─────────────────────────────

export interface WsJoinArea {
  lat: number;
  lng: number;
}

export interface WsPinNew {
  pin: PinObject;
}

export interface WsPinExpired {
  pinId: string;
}

export interface WsPinVoteUpdated {
  pinId: string;
  voteUpCount: number;
  voteDownCount: number;
}

export interface WsPinHidden {
  pinId: string;
}
