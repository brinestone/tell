import { Request, Response, Router } from 'express';
import { prepareHandler }            from '../helpers/handler';
import { useCategoriesDb }           from '../helpers/db';

async function findCategories(_: Request, res: Response) {
  const db = useCategoriesDb();
  const categories = await db.query.categories.findMany();
  res.json(categories);
}

const router = Router();
router.get('/', findCategories);

export const handler = prepareHandler('categories', router);
