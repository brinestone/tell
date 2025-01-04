import { wallets } from "@schemas/finance";
import { sql } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";

export async function seed(t: PgTransaction<any>) {
  const walletId = String(process.env['SYSTEM_WALLET']);
  const systemId = 1;
  const startingBalance = Number(process.env['SYSTEM_STARTING_BALANCE'])
  await t.execute(sql`INSERT INTO ${wallets}(id,owned_by,starting_balance) VALUES (${walletId},${systemId},${startingBalance}) ON CONFLICT (id) DO NOTHING`);
}

export const name = 'wallets';
