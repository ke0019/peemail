import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { geographyPoint } from '../geo-types.js';
import { devices } from './devices.js';
import { events } from './events.js';

export const pins = pgTable(
  'pins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => devices.id),
    content: text('content').notNull(),
    /** PostGIS geography(Point, 4326) */
    location: geographyPoint('location').notNull(),
    isPrivate: boolean('is_private').notNull().default(false),
    /**
     * 公开钉有过期时间（默认 72h）；
     * 私密钉 expiresAt = null，永久保存
     */
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    /** 闻过：自动浏览计数 */
    viewCount: integer('view_count').notNull().default(0),
    /** 气味相投 */
    voteUpCount: integer('vote_up_count').notNull().default(0),
    /** 臭味相投 */
    voteDownCount: integer('vote_down_count').notNull().default(0),
    reportCount: integer('report_count').notNull().default(0),
    /** 举报达到阈值后自动隐藏，待人工审核 */
    isHidden: boolean('is_hidden').notNull().default(false),
    /** 'user' | 'official' */
    pinType: text('pin_type').notNull().default('user'),
    /** 关联活动场景（可空） */
    eventId: uuid('event_id').references(() => events.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // 空间索引（核心查询性能）
    index('pins_location_idx').using('gist', sql`${table.location}`),
    // 过期清理索引
    index('pins_expires_at_idx').on(table.expiresAt),
    // 活动场景查询索引
    index('pins_event_id_idx').on(table.eventId),
    // content 字数限制
    check('pins_content_length', sql`char_length(${table.content}) <= 280`),
    // pin_type 枚举
    check('pins_pin_type', sql`${table.pinType} IN ('user', 'official')`),
  ],
);

export type Pin = typeof pins.$inferSelect;
export type NewPin = typeof pins.$inferInsert;
