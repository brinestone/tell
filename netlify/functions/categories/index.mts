import { Request, Response, Router } from 'express';
import { prepareHandler }            from '../helpers/handler.mjs';
import { useCategoriesDb }           from '../helpers/db.mjs';

async function findCategories(_: Request, res: Response) {
  const db = useCategoriesDb();
  const categories = await db.query.categories.findMany();
  res.json(categories);
}

const router = Router();
router.get('/', findCategories);

export const handler = prepareHandler('categories', router);
