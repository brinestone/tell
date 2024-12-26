import { bigint, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';

export const federatedCredentials = pgTable('federated_credentials', {
  id: varchar({ length: 255 }).notNull().primaryKey(),
  provider: varchar({ length: 255 }).notNull(),
});

export const users = pgTable('users', {
  id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  createdAt: timestamp({ mode: 'date' }).defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
  names: varchar({ length: 100 }).notNull(),
  imageUrl: varchar({ length: 255 }),
  email: varchar({ length: 100 }).notNull(),
  credentials: varchar().notNull().references(() => federatedCredentials.id)
});

export const userSchema = createSelectSchema(users);
