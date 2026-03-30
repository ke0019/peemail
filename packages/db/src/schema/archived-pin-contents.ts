import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { devices } from './devices';
import { pins } from './pins';

/**
 * 活动结束后，个人气味钉内容并入官方气味钉的留言区
 */
export const archivedPinContents = pgTable(
  'archived_pin_contents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    officialPinId: uuid('official_pin_id')
      .notNull()
      .references(() => pins.id),
    /** 原始个人钉 ID（已删除，仅记录） */
    originalPinId: uuid('original_pin_id').notNull(),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => devices.id),
    content: text('content').notNull(),
    originalAt: timestamp('original_at', { withTimezone: true }).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('archived_official_pin_idx').on(table.officialPinId),
  ],
);

export type ArchivedPinContent = typeof archivedPinContents.$inferSelect;
export type NewArchivedPinContent = typeof archivedPinContents.$inferInsert;
