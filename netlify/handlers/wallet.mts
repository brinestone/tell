import { useFinanceDb } from "@helpers/db.mjs";
import { wallets } from "@schemas/finance";
import { Request, Response } from "express";

export async function calculateUserWalletBalances(req: Request, res: Response) {
  const db = useFinanceDb();

}

export async function doCreateUserWallet(userId: number) {
  const db = useFinanceDb();
  await db.insert(wallets).values({
    ownedBy: userId
  });
}
