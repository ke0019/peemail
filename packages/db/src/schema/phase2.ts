import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { devices } from './devices.js';

/** 行进聊天室（Phase 2） */
export const motionRooms = pgTable(
  'motion_rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => devices.id),
    /** 'active' | 'converted' | 'dissolved' */
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
  },
  (table) => [
    check('motion_rooms_status', sql`${table.status} IN ('active', 'converted', 'dissolved')`),
  ],
);

export const motionRoomMembers = pgTable(
  'motion_room_members',
  {
    roomId: uuid('room_id')
      .notNull()
      .references(() => motionRooms.id),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => devices.id),
    /** 'creator' | 'member' */
    role: text('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp('left_at', { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.roomId, table.deviceId] }),
    check('motion_room_members_role', sql`${table.role} IN ('creator', 'member')`),
  ],
);

/**
 * 手机号验证记录（Phase 2）
 * 仅在封禁解封场景写入，正常使用不涉及
 * phone_hash = SHA-256(手机号)，不存明文
 */
export const phoneVerifications = pgTable(
  'phone_verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    phoneHash: text('phone_hash').notNull(),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => devices.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

export type MotionRoom = typeof motionRooms.$inferSelect;
export type MotionRoomMember = typeof motionRoomMembers.$inferSelect;
export type PhoneVerification = typeof phoneVerifications.$inferSelect;
