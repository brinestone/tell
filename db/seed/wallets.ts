import { wallets } from "@schemas/finance";
import { sql } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";

export async function seed(t: PgTransaction<any>) {
  const walletId = String(process.env['SYSTEM_WALLET']);
  const systemId = 1;
  const startingBalance = Number(process.env['SYSTEM_STARTING_BALANCE'])
  // await t.execute(sql`INSERT INTO ${wallets} (id,ownedBy,startingBalance) VALUES (${walletId},${systemId},${startingBalance}) ON CONFLICT (id) DO NOTHING`);
  await t.insert(wallets).values({
    ownedBy: systemId,
    id: walletId,
    startingBalance
  }).onConflictDoNothing({
    target: [wallets.id]
  });
}

export const name = 'wallets';
