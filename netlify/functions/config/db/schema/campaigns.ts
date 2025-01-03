import { bigint, check, date, integer, pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import {
  users
}                                                                                  from '@functions/config/db/schema/users';
import { sql }                                                                     from 'drizzle-orm';
import { createInsertSchema }                                                      from 'drizzle-zod';

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
  createdBy: bigint({ mode: 'number' }).notNull().references(() => users.id)
  // channels: varchar({ length: 100 }).array().notNull()
});

export const newCampaignSchema = createInsertSchema(campaigns);
export const channelEnum = pgEnum('publish_channels', ['telegram']);

export const campaignPublications = pgTable('campaignPublications', {
    id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    createdAt: timestamp({ mode: 'date' }).defaultNow(),
    updatedAt: timestamp({ mode: 'date' }).defaultNow(),
    campaign: bigint({ mode: 'number' }).notNull().references(() => campaigns.id),
    assignedTokens: integer().notNull(),
    publishAfter: date({ mode: 'date' }).defaultNow(),
    publishBefore: date({ mode: 'date' })
  },
  table => [{
    checkConstraint: check('tokens_check', sql`${table.assignedTokens} > 0`)
  }]);

export const newPublicationSchema = createInsertSchema(campaignPublications)
