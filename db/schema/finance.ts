import { and, eq, or, sql, sum } from 'drizzle-orm';
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
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const paymentMethodProviders = pgEnum('payment_method_provider', ['momo', 'virtual']);
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
  from: uuid().references(() => wallets.id),
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
  allocated: bigint({ mode: 'number' }).notNull(),
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
  exchangeRateSnapshot: real().notNull(),
  convertedValue: real().notNull(),
  notes: text(),
  currency: varchar({ length: 10 }).notNull(),
  params: jsonb(),
  inbound: boolean().notNull()
});

export const fundingBalances = pgView('vw_funding_balances')
  .as(qb => {
    const incomingTransactions = qb.select({
      walletId: walletTransactions.to,
      totalIncoming: sql<number>`COALESCE(SUM(${walletTransactions.value}), 0)`.as('total_incoming')
    })
      .from(walletTransactions)
      .where(eq(walletTransactions.status, 'complete'))
      .groupBy(walletTransactions.to)
      .as('incoming_transactions');

    const outgoingTransactions = qb.select({
      walletId: walletTransactions.from,
      totalOutgoing: sql<number>`COALESCE(SUM(${walletTransactions.value}), 0)`.as('total_outgoing')
    }).from(walletTransactions)
      .where(eq(walletTransactions.status, 'complete'))
      .groupBy(walletTransactions.from)
      .as('outgoing_transactions');

    const allocationSummary = qb.select({
      walletId: walletCreditAllocations.wallet,
      totalAllocated: sql<number>`COALESCE(SUM(${walletCreditAllocations.allocated}), 0)`.as('total_allocated')
    }).from(walletCreditAllocations)
      .where(eq(walletCreditAllocations.status, 'active'))
      .groupBy(walletCreditAllocations.wallet)
      .as('allocation_summary');

    return qb.select({
      id: wallets.id,
      ownerId: wallets.ownedBy,
      balance: sql<number>`
        ${wallets.startingBalance} -
        COALESCE(${allocationSummary.totalAllocated},0) -
        COALESCE(${outgoingTransactions.totalOutgoing},0) +
        COALESCE(${incomingTransactions.totalIncoming},0)
      `.as('balance')
    }).from(wallets)
      .leftJoin(incomingTransactions, w => eq(incomingTransactions.walletId, w.id))
      .leftJoin(outgoingTransactions, w => eq(outgoingTransactions.walletId, w.id))
      .leftJoin(allocationSummary, w => eq(allocationSummary.walletId, w.id))
  });

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

export const vwCreditAllocations = pgView('vw_credit_allocations').as(
  qb => {
    return qb.select({
      id: walletCreditAllocations.id,
      wallet: walletCreditAllocations.wallet,
      allocated: walletCreditAllocations.allocated,
      exhausted: sql<number>`
        SUM(
          CASE
            WHEN ${and(eq(walletTransactions.type, 'reward'), eq(walletTransactions.from, walletCreditAllocations.wallet))} THEN ${walletTransactions.value}
            ELSE 0
          END
        )
      `.as('exhausted')
    })
      .from(walletCreditAllocations)
      .leftJoin(walletTransactions, allocation => and(eq(allocation.id, walletTransactions.creditAllocation), eq(walletTransactions.type, 'reward'), eq(walletTransactions.from, allocation.wallet)))
      .groupBy(walletCreditAllocations.id)
  }
)
