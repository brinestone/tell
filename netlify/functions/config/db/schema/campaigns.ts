import { bigint, date, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const campaigns = pgTable('campaigns', {
  id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  images: text().array(),
  videos: text().array(),
  links: text().array(),
  emails: text().array(),
  phones: text().array(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  categories: bigint({ mode: 'number' }).array().notNull(),
  channels: varchar({ length: 100 }).array().notNull()
});

export const campaignPublications = pgTable('campaignPublications', {})
