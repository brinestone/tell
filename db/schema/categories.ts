import { bigint, pgTable, text, varchar } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  image: varchar({ length: 500 }),
});
