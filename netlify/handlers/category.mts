import { useCategoriesDb } from "@helpers/db.mjs";
import { handleError } from "@helpers/error.mjs";
import { Request, Response } from 'express';

export async function findAllCategories(_: Request, res: Response) {
  const db = useCategoriesDb();
  try {
    const categories = await db.query.categories.findMany();
    res.json(categories);
  } catch (e) {
    handleError(e as Error, res);
  }
}
