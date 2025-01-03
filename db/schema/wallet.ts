import { bigint, bigserial, boolean, json, pgEnum, pgTable, real, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const wallets = pgTable('wallets', {
  id: bigserial({ mode: 'number' }).primaryKey(),
  ownedBy: bigint({ mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp({ mode: 'date' }).defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
  startingBalance: bigint({ mode: 'number' }).default(0)
});

export const transactionStatus = pgEnum('transaction_status', ['pending', 'cancelled', 'complete']);
export const paymentMethods = pgEnum('payment_methods', ['momo']);
export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid().primaryKey().defaultRandom(),
  wallet: bigint({ mode: 'number' }).notNull().references(() => wallets.id),
  value: bigint({ mode: 'number' }).notNull(),
  from: bigint({ mode: 'number' }).notNull().references(() => wallets.id),
  to: bigint({ mode: 'number' }).notNull().references(() => wallets.id),
  recordedAt: timestamp({ mode: 'date' }).defaultNow(),
  completedAt: timestamp({ mode: 'date' }),
  cancelledAt: timestamp({ mode: 'date' }),
  status: transactionStatus().default('pending'),
  accountTransaction: uuid().references(() => paymentTransactions.id)
});
export const paymentTransactions = pgTable('account_transactions', {
  id: uuid().primaryKey().defaultRandom(),
  paymentMethod: paymentMethods().notNull(),
  status: transactionStatus().notNull(),
  externalTransactionId: varchar({ length: 400 }),
  recordedAt: timestamp({ mode: 'date' }).defaultNow(),
  completedAt: timestamp({ mode: 'date' }),
  cancelledAt: timestamp({ mode: 'date' }),
  value: real().notNull(),
  currency: varchar({ length: 10 }).notNull(),
  paymentMethodExtras: json(),
  inbound: boolean().notNull()
});
