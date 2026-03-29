import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { geographyPolygon } from '../geo-types.js';

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    /** 场馆地理围栏 */
    venueBoundary: geographyPolygon('venue_boundary').notNull(),
    /** 活动场景内个人钉存活秒数，默认 6h */
    personalPinTtl: integer('personal_pin_ttl').notNull().default(21600),
    /** 合约到期时间，null = 长期有效 */
    contractEndsAt: timestamp('contract_ends_at', { withTimezone: true }),
    /** 'active' | 'hidden' */
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('events_venue_idx').using('gist', sql`${table.venueBoundary}`),
    check('events_status', sql`${table.status} IN ('active', 'hidden')`),
  ],
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
