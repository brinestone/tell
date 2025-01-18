import { sql } from 'drizzle-orm';
import { bigint, check, date, integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { users } from './users';
import { z } from 'zod';

export const campaigns = pgTable('campaigns', {
  id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  media: text().array().default([]),
  links: text().array().default([]),
  emails: text().array().default([]),
  phones: text().array().default([]),
  createdAt: timestamp({ mode: 'date' }).defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
  categories: bigint({ mode: 'number' }).array().default([]),
  createdBy: bigint({ mode: 'number' }).notNull().references(() => users.id),
  redirectUrl: varchar({ length: 500 })
});

export const CampaignLookupSchema = createSelectSchema(campaigns).pick({
  id: true,
  title: true,
  updatedAt: true,
  categories: true
}).transform(({ categories, title, updatedAt, id }) => {
  return { categoryCount: categories?.length ?? 0, title, updatedAt, id };
});

export const newCampaignSchema = createInsertSchema(campaigns).pick({
  title: true,
  createdBy: true
});

export const updateCampaignSchema = createUpdateSchema(campaigns).pick({
  title: true,
  categories: true,
  description: true,
  emails: true,
  links: true,
  phones: true,
  media: true,
  redirectUrl: true
}).extend({
  title: z.string().optional(),
  categories: z.array(z.number()).optional(),
  description: z.string().optional(),
  emails: z.array(z.string()).optional(),
  links: z.array(z.string().url()).optional(),
  phones: z.array(z.string()).optional(),
  media: z.array(z.string()).optional(),
  redirectUrl: z.string().url().optional()
});

export const campaignPublications = pgTable('campaign_publications', {
  id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  createdAt: timestamp({ mode: 'date' }).defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow(),
  campaign: bigint({ mode: 'number' }).notNull().references(() => campaigns.id),
  credits: integer().notNull(),
  publishAfter: date({ mode: 'string' }).defaultNow(),
  publishBefore: date({ mode: 'string' })
},
  table => [{
    checkConstraint: check('tokens_check', sql`${table.credits}
    > 0`)
  }]);

export const newPublicationSchema = createInsertSchema(campaignPublications).refine(data => data.credits > 0);
