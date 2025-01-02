import { bigint, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users }                                     from '@functions/config/db/schema/users';
import { createInsertSchema }                        from 'drizzle-zod';

export const campaigns = pgTable('campaigns', {
  id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  media: text().array(),
  links: text().array(),
  emails: text().array(),
  phones: text().array(),
  createdAt: timestamp({ mode: 'date' }).defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow(),
  categories: bigint({ mode: 'number' }).array().notNull(),
  createdBy: bigint({mode: 'number'}).notNull().references(() => users.id)
  // channels: varchar({ length: 100 }).array().notNull()
});

export const newCampaignSchema = createInsertSchema(campaigns);

export const campaignPublications = pgTable('campaignPublications', {})
