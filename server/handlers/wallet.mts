import { extractUser } from "@helpers/auth.mjs";
import { useFinanceDb } from "@helpers/db.mjs";
import { handleError } from "@helpers/error.mjs";
import { fundingBalances, rewardBalances, wallets } from "@schemas/finance";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";

export async function getUserWalletBalances(req: Request, res: Response) {
  const db = useFinanceDb();
  const user = extractUser(req);
  try {
    const [funding] = await db.select().from(fundingBalances).where(balance => eq(balance.ownerId, user.id));
    const [rewards] = await db.select().from(rewardBalances).where(balance => eq(balance.ownerId, user.id));
    res.json({ funding, rewards });
  } catch (e) {
    handleError(e as Error, res);
  }
}

export async function doDeleteUserWallet(userId: number) {
  const db = useFinanceDb();
  await db.transaction(t => {
    return t.delete(wallets).where(eq(wallets.ownedBy, userId));
  });
}

export async function doCreateUserWallet(userId: number) {
  const db = useFinanceDb();
  await db.transaction(t => t.insert(wallets).values({
    ownedBy: userId
  }));
}
