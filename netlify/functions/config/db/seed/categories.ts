import { useCategoriesDb } from '@functions/helpers/db.mjs';
import data                from './categories.json';
import { categories }      from '@functions/config/db/schema/categories';

export async function seed() {
  const db = useCategoriesDb();
  await db.delete(categories);
  await db.insert(categories).values(data);
}

export const name = 'categories'

