import { walletCreditAllocations } from '@schemas/finance';
import { bigint, date, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';

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
  creditAllocation: uuid().notNull().references(() => walletCreditAllocations.id),
  publishAfter: date({ mode: 'string' }).defaultNow(),
  publishBefore: date({ mode: 'string' })
});

export const newPublicationSchema = createInsertSchema(campaignPublications)
  .extend({
    credits: z.number().min(25),
    creditAllocation: z.string().uuid().optional()
  })
  .refine(data => data.credits > 0);

