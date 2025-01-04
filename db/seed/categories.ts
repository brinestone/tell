import { categories } from 'db/schema/categories';
import { sql } from 'drizzle-orm';
import { PgTransaction } from 'drizzle-orm/pg-core';
import data from './categories.json';

export async function seed(t: PgTransaction<any>) {
  const entries = data.map((d, i) => ({ id: i + 1, ...d }));
  for await (const entry of entries) {
    await t.execute(sql`INSERT INTO ${categories}(id, title, description) OVERRIDING SYSTEM VALUE
                           VALUES (${entry.id}, ${entry.title}, ${entry.description}) ON CONFLICT (id) DO NOTHING`);
  }
}

export const name = 'categories'

