import { useUsersDb } from "@helpers/db.mjs";
import { users } from "../schema/users";
import { sql } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";

export const name = 'users';
export async function seed(t: PgTransaction<any>) {
  const systemUserId = 1;
  const db = useUsersDb();
  await t.execute(sql`INSERT INTO ${users}(id,names,email) OVERRIDING SYSTEM VALUE VALUES (${systemUserId},${'System'},${'support@tellthem.netlify.app'}) ON CONFLICT (id) DO NOTHING`);

}
