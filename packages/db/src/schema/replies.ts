import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { devices } from './devices.js';
import { pins } from './pins.js';

export const replies = pgTable(
  'replies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pinId: uuid('pin_id')
      .notNull()
      .references(() => pins.id, { onDelete: 'cascade' }),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => devices.id),
    content: text('content').notNull(),
    /** 支持二级嵌套回复 */
    parentId: uuid('parent_id').references((): ReturnType<typeof uuid> => replies.id as ReturnType<typeof uuid>),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('replies_pin_id_idx').on(table.pinId),
    check('replies_content_length', sql`char_length(${table.content}) <= 280`),
  ],
);

export type Reply = typeof replies.$inferSelect;
export type NewReply = typeof replies.$inferInsert;
