import { Request, Response, Router } from 'express';
import { prepareHandler }            from '../helpers/handler.mjs';
import { auth }                      from '../middleware/auth.mjs';

async function findUsers(req: Request, res: Response) {
  res.json([{ user: 'foo' }]);
}

const router = Router();
router.get('/', auth, findUsers);

export const handler = prepareHandler('users', router);
