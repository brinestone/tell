import { extractUser } from '@helpers/auth.mjs';
import { useFinanceDb } from '@helpers/db.mjs';
import { handleError } from '@helpers/error.mjs';
import { isProduction } from '@helpers/handler.mjs';
import { useLogger } from '@logger/common';
import { fundingBalances, paymentTransactions, rewardBalances, wallets, walletTransactions } from '@schemas/finance';
import { WalletTopupInputValidationSchema, WalletTransfersInputValidationSchema } from '@zod-schemas/wallet.mjs';
import { count, desc, eq, or } from 'drizzle-orm';
import { Request, Response } from 'express';
import { fromError } from 'zod-validation-error';
import { doCollectFunds } from './payment.mjs';
import { PgQueryResultHKT, PgTransaction } from 'drizzle-orm/pg-core';
import { BalancesSchema, WalletTransfersResponseSchema } from '@lib/models/wallet';

const logger = useLogger({
  service: 'wallet'
});

export async function handleFindUserWalletTransfers(req: Request, res: Response) {
  const user = extractUser(req);
  logger.info('finding user wallet transactions', { user: user.id });
  const { success, error, data } = WalletTransfersInputValidationSchema.safeParse(req.query);
  if (!success) {
    res.status(400).json({ message: fromError(error) });
    return;
  }

  const { page, size } = data;
  const db = useFinanceDb();

  try {
    const wallet = await db.query.wallets.findFirst({
      where: (w, { eq }) => eq(w.ownedBy, user.id)
    });

    if (!wallet) {
      res.status(404).json({ message: 'Wallet not found' });
      return;
    }

    const [{ total }] = await db.select({ total: count() })
      .from(walletTransactions)
      .where(or(eq(walletTransactions.from, wallet.id), eq(walletTransactions.to, wallet.id)))
      .limit(1);

    const transactions = await db.select({
      id: walletTransactions.id,
      from: walletTransactions.from,
      to: walletTransactions.to,
      amount: walletTransactions.value,
      status: walletTransactions.status,
      type: walletTransactions.type,
      date: walletTransactions.recordedAt,
      payment: {
        id: walletTransactions.accountTransaction,
        currency: paymentTransactions.currency,
        amount: paymentTransactions.value,
        status: paymentTransactions.status
      }
    }).from(walletTransactions)
      .leftJoin(paymentTransactions, wt => eq(paymentTransactions.id, wt.payment.id))
      .orderBy(desc(walletTransactions.recordedAt))
      .where(or(eq(walletTransactions.from, wallet.id), eq(walletTransactions.to, wallet.id)))
      .offset(page * size)
      .limit(size);

    res.json(WalletTransfersResponseSchema.parse({
      data: transactions,
      total
    }));
  } catch (e) {
    handleError(e as Error, res);
  }
}

export async function handleWalletTopup(req: Request, res: Response) {
  const user = extractUser(req);
  logger.info('handling wallet top-up request', { user: user.id });
  const { success, error, data } = await WalletTopupInputValidationSchema(isProduction(req)).safeParseAsync(req.body);

  if (!success) {
    logger.warn('top-up request validation failed', { user: user.id, req: req.body });
    res.status(400).json({ message: fromError(error) });
    return;
  }

  const { amount, currency, paymentMethod } = data;
  const db = useFinanceDb();

  try {
    logger.verbose('looking up user wallet', { user: user.id });
    const wallet = await db.query.wallets.findFirst({
      columns: {
        id: true
      },
      where: (w, { eq }) => eq(w.ownedBy, user.id)
    });

    if (!wallet) throw new Error('Wallet not found for user ' + user);

    await db.transaction(async t => {
      logger.info('collecting funds for wallet top-up', { user: user.id });
      const transactionId = await doCollectFunds(t as unknown as PgTransaction<PgQueryResultHKT>, user.id, paymentMethod, amount, currency, 'wallet top-up');
      const trx = await t.query.paymentTransactions.findFirst({
        where: (t, { eq }) => eq(t.id, transactionId)
      });

      const credits = Math.ceil(Number(trx?.exchangeRateSnapshot) * amount);
      return t.insert(walletTransactions).values({
        type: 'funding',
        to: wallet.id,
        status: trx?.status,
        notes: 'wallet top-up',
        from: String(process.env['SYSTEM_WALLET']),
        completedAt: trx?.completedAt,
        value: credits,
        accountTransaction: transactionId,
      });
    });
    logger.info('wallet top-up successful', { user: user.id });
    res.status(201).json({});
  } catch (e) {
    handleError(e as Error, res);
  }
}

export async function getUserWalletBalances(req: Request, res: Response) {
  const db = useFinanceDb();
  const user = extractUser(req);
  try {
    const [funding] = await db.select().from(fundingBalances).where(balance => eq(balance.ownerId, user.id));
    const [rewards] = await db.select().from(rewardBalances).where(balance => eq(balance.ownerId, user.id));
    res.json(BalancesSchema.parse({ funding, rewards }));
  } catch (e) {
    handleError(e as Error, res);
  }
}

export async function doDeleteUserWallet(userId: number) {
  logger.info('removing user wallet', { userId });
  const db = useFinanceDb();
  await db.transaction(t => {
    return t.delete(wallets).where(eq(wallets.ownedBy, userId));
  });
}

export async function doCreateUserWallet(userId: number, startingBalance: number = 0) {
  logger.info('creating user wallet', { startingBalance, userId });
  const db = useFinanceDb();
  await db.transaction(t => t.insert(wallets).values({
    ownedBy: userId,
    startingBalance
  }));
}
