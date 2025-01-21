import { PgTransaction } from "drizzle-orm/pg-core";
import { users } from "../schema/users";

export const name = 'users';
export async function seed(t: PgTransaction<any>) {
  const systemUserId = 1;
  await t.insert(users)
    .overridingSystemValue()
    .values({
      id: systemUserId,
      names: 'System',
      email: 'support@tellthem.netlify.app'
    }).onConflictDoNothing({
      target: [users.id]
    });
}
