import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { devices } from './devices';
import { pins } from './pins';
import { replies } from './replies';

/** 屏蔽：再也看不到某只动物的气味钉 */
export const blocks = pgTable(
  'blocks',
  {
    blockerDeviceId: uuid('blocker_device_id')
      .notNull()
      .references(() => devices.id),
    blockedDeviceId: uuid('blocked_device_id')
      .notNull()
      .references(() => devices.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.blockerDeviceId, table.blockedDeviceId] }),
  ],
);

/** 举报队列 */
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterId: uuid('reporter_id')
      .notNull()
      .references(() => devices.id),
    pinId: uuid('pin_id').references(() => pins.id),
    replyId: uuid('reply_id').references(() => replies.id),
    reason: text('reason').notNull(),
    /** 'pending' | 'reviewed' | 'dismissed' */
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('reports_status', sql`${table.status} IN ('pending', 'reviewed', 'dismissed')`),
    check('reports_reason', sql`${table.reason} IN ('spam', 'offensive', 'misleading', 'other')`),
  ],
);

export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
