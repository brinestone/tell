import { bigint, boolean, json, pgEnum, pgTable, pgView, real, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import { and, desc, eq, not, or, sql } from "drizzle-orm";

export const wallets = pgTable('wallets', {
  id: uuid().primaryKey().defaultRandom(),
  ownedBy: bigint({ mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp({ mode: 'date' }).defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
  startingBalance: bigint({ mode: 'number' }).default(0)
});

export const transactionStatus = pgEnum('transaction_status', ['pending', 'cancelled', 'complete']);
export const paymentMethods = pgEnum('payment_methods', ['momo']);
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

export const fundingBalances = pgView('vw_funding_balances')
  .as(qb => qb.select({
    id: wallets.id,
    balance: sql<number>`${wallets.startingBalance} + SUM(
      CASE
        WHEN ${and(eq(walletTransactions.from, wallets.id), eq(walletTransactions.type, 'funding'), eq(walletTransactions.status, 'complete'))} THEN -${walletTransactions.value}
        WHEN ${and(eq(walletTransactions.to, wallets.id), eq(walletTransactions.type, 'funding'), eq(walletTransactions.status, 'complete'))} THEN ${walletTransactions.value}
        ELSE 0
      END
    )::BIGINT`.as('balance'),
    ownerId: wallets.ownedBy,
    ownerName: users.names
  }).from(wallets)
    .leftJoin(walletTransactions, (wallet) => or(eq(wallet.id, walletTransactions.from), eq(wallet.id, walletTransactions.to)))
    .leftJoin(users, (wallet) => eq(wallet.ownerId, users.id))
    .groupBy(wallets.id, wallets.ownedBy, users.names)
  );

export const rewardBalances = pgView('vw_reward_balances')
.as(qb => qb.select({
  id: wallets.id,
  balance: sql<number>`${wallets.startingBalance} + SUM(
    CASE
      WHEN ${and(eq(walletTransactions.from, wallets.id), eq(walletTransactions.type, 'reward'), eq(walletTransactions.status, 'complete'))} THEN -${walletTransactions.value}
      WHEN ${and(eq(walletTransactions.to, wallets.id), eq(walletTransactions.type, 'reward'), eq(walletTransactions.status, 'complete'))} THEN ${walletTransactions.value}
      ELSE 0
    END
  )::BIGINT`.as('balance'),
  ownerId: wallets.ownedBy,
  ownerName: users.names
}).from(wallets)
  .leftJoin(walletTransactions, (wallet) => or(eq(wallet.id, walletTransactions.from), eq(wallet.id, walletTransactions.to)))
  .leftJoin(users, (wallet) => eq(wallet.ownerId, users.id))
  .groupBy(wallets.id, wallets.ownedBy, users.names)
);
