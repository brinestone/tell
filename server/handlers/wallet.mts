import { extractUser } from '@helpers/auth.mjs';
import { useFinanceDb } from '@helpers/db.mjs';
import { handleError } from '@helpers/error.mjs';
import { useLogger } from '@logger/common';
import { BalancesSchema, fundingBalances, rewardBalances, wallets } from '@schemas/finance';
import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';

const logger = useLogger({
  service: 'wallet'
});

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
