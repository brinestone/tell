import { Request, Response, Router } from 'express';
import { prepareHandler }            from '../helpers/handler.mjs';
import { useCategoriesDb }           from '../helpers/db.mjs';
import { handleError }               from '@functions/helpers/error.mjs';

async function findCategories(_: Request, res: Response) {
  const db = useCategoriesDb();
  try {
    const categories = await db.query.categories.findMany();
    res.json(categories);
  } catch (e) {
    handleError(e as Error, res);
  }
}

const router = Router();
router.get('/', findCategories);

export const handler = prepareHandler('categories', router);
