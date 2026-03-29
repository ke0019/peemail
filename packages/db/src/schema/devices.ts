import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';

export const devices = pgTable('devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** SHA-256(设备唯一标识)，不可反查 */
  deviceHash: text('device_hash').notNull().unique(),
  /** SHA-256(恢复码派生主密钥)，用于换机恢复身份校验 */
  identityKeyHash: text('identity_key_hash').unique(),
  nickname: text('nickname').notNull(),
  /** 动物标识符，如 "otter" */
  avatarAnimal: text('avatar_animal').notNull(),
  /** 主题色，如 "#A8D8A8" */
  avatarColor: text('avatar_color').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  // 封禁字段（Phase 2）
  isBanned: boolean('is_banned').notNull().default(false),
  banReason: text('ban_reason'),
  bannedAt: timestamp('banned_at', { withTimezone: true }),
});

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
