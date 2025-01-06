import { bigint, date, jsonb, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema, createUpdateSchema }                         from 'drizzle-zod';

export const accountConnectionProviders = pgEnum('account_connection_providers', ['telegram']);
export const accountConnectionStatus = pgEnum('account_connection_status', ['active', 'inactive', 'reconnect_required']);
export const accountConnections = pgTable('account_connections', {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp({ mode: 'date' }).defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
  user: bigint({ mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: accountConnectionProviders().notNull(),
  params: jsonb().notNull(),
  status: accountConnectionStatus().notNull().default('active')
});

export const federatedCredentials = pgTable('federated_credentials', {
  id: varchar({ length: 255 }).notNull().primaryKey(),
  provider: varchar({ length: 255 }).notNull(),
  lastAccessToken: varchar({ length: 500 }),
  createdAt: timestamp({ mode: 'date' }).defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
});

export const users = pgTable('users', {
  id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity({ startWith: 100 }).primaryKey(),
  createdAt: timestamp({ mode: 'date' }).defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
  names: varchar({ length: 100 }).notNull(),
  imageUrl: varchar({ length: 255 }),
  email: varchar({ length: 100 }).notNull(),
  dob: date({ mode: 'date' }),
  phone: varchar({ length: 255 }),
  credentials: varchar().references(() => federatedCredentials.id)
});

export const themePrefs = pgEnum('theme_pref', ['system', 'dark', 'light']);
export const userPrefs = pgTable('user_prefs', {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp({ mode: 'date' }).defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
  user: bigint({ mode: 'number' }).notNull().references(() => users.id),
  country: varchar({ length: 2 }).notNull(),
  theme: themePrefs().notNull().default('light'),
  currency: varchar({ length: 3 }).notNull(),
  language: varchar({ length: 2 }).notNull()
});

export const updatePrefSchema = createUpdateSchema(userPrefs).pick({
  country: true,
  theme: true,
  currency: true,
  language: true
});

export const userSchema = createSelectSchema(users);
