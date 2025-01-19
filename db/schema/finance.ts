import { and, eq, or, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  pgView,
  real,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const paymentMethodProviders = pgEnum('payment_method_provider', ['momo']);
export const paymentMethodStatus = pgEnum('payment_method_status', ['active', 'inactive', 're-connection required']);
export const paymentMethods = pgTable('payment_methods', {
  id: uuid().primaryKey().defaultRandom(),
  provider: paymentMethodProviders().notNull(),
  params: jsonb().notNull(),
  status: paymentMethodStatus().notNull().default('active'),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
  owner: bigint({ mode: 'number' }).notNull().references(() => users.id),
}, table => {
  return {
    idx: uniqueIndex().on(table.provider, table.owner)
  }
});

export const wallets = pgTable('wallets', {
  id: uuid().primaryKey().defaultRandom(),
  ownedBy: bigint({ mode: 'number' }).notNull().references(() => users.id),
  createdAt: timestamp({ mode: 'date' }).defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
  startingBalance: bigint({ mode: 'number' }).default(0)
});

export const transactionStatus = pgEnum('transaction_status', ['pending', 'cancelled', 'complete']);
export const walletTransactionType = pgEnum('wallet_transaction_type', ['funding', 'reward', 'withdrawal']);
export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid().primaryKey().defaultRandom(),
  value: bigint({ mode: 'number' }).notNull(),
  from: uuid().notNull().references(() => wallets.id),
  to: uuid().notNull().references(() => wallets.id),
  recordedAt: timestamp({ mode: 'date' }).defaultNow(),
  completedAt: timestamp({ mode: 'date' }),
  cancelledAt: timestamp({ mode: 'date' }),
  status: transactionStatus().default('pending'),
  type: walletTransactionType().notNull(),
  notes: text(),
  accountTransaction: uuid().references(() => paymentTransactions.id),
  creditAllocation: uuid().references(() => walletCreditAllocations.id)
});

export const creditAllocationStatus = pgEnum('credit_allocation_status', ['active', 'cancelled', 'complete']);
export const walletCreditAllocations = pgTable('credit_allocations', {
  id: uuid().primaryKey().defaultRandom(),
  exhausted: real().notNull().default(0),
  allocated: real().notNull(),
  createdAt: timestamp({ mode: 'date' }).defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow(),
  status: creditAllocationStatus().notNull().default('active'),
  wallet: uuid().notNull().references(() => wallets.id)
});

export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid().primaryKey().defaultRandom(),
  paymentMethod: paymentMethodProviders().notNull(),
  status: transactionStatus().notNull(),
  externalTransactionId: varchar({ length: 400 }),
  recordedAt: timestamp({ mode: 'date' }).defaultNow(),
  completedAt: timestamp({ mode: 'date' }),
  cancelledAt: timestamp({ mode: 'date' }),
  value: real().notNull(),
  notes: text(),
  currency: varchar({ length: 10 }).notNull(),
  params: jsonb(),
  inbound: boolean().notNull()
});

export const fundingBalances = pgView('vw_funding_balances')
  .as(qb => qb.select({
    id: wallets.id,
    balance: sql<number>`
      ${wallets.startingBalance} +
      SUM(
        CASE
          WHEN ${eq(walletCreditAllocations.status, 'active')} THEN ${walletCreditAllocations.allocated}
          ELSE 0
        END
      ) * -1 +
      SUM(
        CASE
          WHEN ${and(eq(walletTransactions.from, wallets.id), eq(walletTransactions.type, 'funding'), eq(walletTransactions.status, 'complete'))} THEN -${walletTransactions.value}
          WHEN ${and(eq(walletTransactions.to, wallets.id), eq(walletTransactions.type, 'funding'), eq(walletTransactions.status, 'complete'))} THEN ${walletTransactions.value}
          ELSE 0
        END
      )::BIGINT`.as('balance'),
    ownerId: wallets.ownedBy
  }).from(wallets)
    .leftJoin(walletTransactions, (wallet) => or(eq(wallet.id, walletTransactions.from), eq(wallet.id, walletTransactions.to)))
    .leftJoin(users, (wallet) => eq(wallet.ownerId, users.id))
    .leftJoin(walletCreditAllocations, (wallet) => eq(wallet.id, walletCreditAllocations.wallet))
    .groupBy(wallets.id, wallets.ownedBy)
  );

export const rewardBalances = pgView('vw_reward_balances')
  .as(qb => qb.select({
    id: wallets.id,
    balance: sql<number>`
      SUM(
        CASE
          WHEN ${and(eq(walletTransactions.from, wallets.id), eq(walletTransactions.type, 'reward'), eq(walletTransactions.status, 'complete'))} THEN -${walletTransactions.value}
          WHEN ${and(eq(walletTransactions.to, wallets.id), eq(walletTransactions.type, 'reward'), eq(walletTransactions.status, 'complete'))} THEN ${walletTransactions.value}
          ELSE 0
        END
      )::BIGINT`.as('balance'),
    ownerId: wallets.ownedBy
  }).from(wallets)
    .leftJoin(walletTransactions, (wallet) => or(eq(wallet.id, walletTransactions.from), eq(wallet.id, walletTransactions.to)))
    .leftJoin(users, (wallet) => eq(wallet.ownerId, users.id))
    .groupBy(wallets.id, wallets.ownedBy)
  );

export const BalancesSchema = z.object({
  funding: createSelectSchema(fundingBalances).extend({
    balance: z.union([z.string(), z.number()]).pipe(z.coerce.number())
  }),
  rewards: createSelectSchema(rewardBalances).extend({
    balance: z.union([z.string(), z.number()]).pipe(z.coerce.number())
  })
});

export const vwCreditAllocations = pgView('vw_credit_allocations').as(
  qb => {
    return qb.select({
      id: walletCreditAllocations.id,
      wallet: walletCreditAllocations.wallet,
      allocated: walletCreditAllocations.allocated,
      exhausted: sql<number>`
        COALESCE(SUM(${walletTransactions.value}), 0)
      `.as('exhausted')
    })
      .from(walletCreditAllocations)
      .leftJoin(walletTransactions, allocation => and(eq(allocation.id, walletTransactions.creditAllocation), eq(walletTransactions.type, 'reward'), eq(walletTransactions.from, allocation.wallet)))
      .groupBy(walletCreditAllocations.id)
  }
)
