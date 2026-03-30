import {
  pgTable,
  uuid,
  smallint,
  timestamp,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { devices } from './devices';
import { pins } from './pins';

export const votes = pgTable(
  'votes',
  {
    pinId: uuid('pin_id')
      .notNull()
      .references(() => pins.id, { onDelete: 'cascade' }),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => devices.id),
    /** 1 = 气味相投，-1 = 臭味相投 */
    value: smallint('value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.pinId, table.deviceId] }),
    check('votes_value', sql`${table.value} IN (1, -1)`),
  ],
);

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
