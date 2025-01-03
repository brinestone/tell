import { useCategoriesDb } from '@functions/helpers/db.mjs';
import data                from './categories.json';
import { categories }      from '@functions/config/db/schema/categories';
import { sql }             from 'drizzle-orm';

export async function seed() {
  const db = useCategoriesDb();
  const entries = data.map((d, i) => ({ id: i + 1, ...d }));
  await db.transaction(async t => {
    for await (const entry of entries) {
      await t.execute(sql`INSERT INTO ${categories}(id, title, description) OVERRIDING SYSTEM VALUE
                           VALUES (${entry.id}, ${entry.title}, ${entry.description}) ON CONFLICT (id) DO NOTHING`);
    }
  });
}

export const name = 'categories'

