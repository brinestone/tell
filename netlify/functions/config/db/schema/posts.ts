import { bigint, bigserial, date, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
  id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  title: varchar({length: 255}).notNull(),
  description: varchar({length: 500}).notNull(),
  imageUrl: varchar({length: 255}).notNull(),
  links: varchar({length: 255}).array(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  perUserMaxShares: integer().default(1).notNull(),
  shareableBefore: date(),
  shareableAfter: date().defaultNow(),
  categories: bigint({mode: 'number'}).array().notNull(),
  platforms: varchar({length: 100}).array().notNull()
});
