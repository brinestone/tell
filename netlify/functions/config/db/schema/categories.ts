import { bigint, pgTable, varchar } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  name: varchar({length: 255}).notNull(),
  description: varchar({length: 500}).notNull(),
  image: varchar({length: 500}),
})
