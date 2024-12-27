import { NextFunction, Request, Response, Router } from 'express';
import { prepareHandler } from '../helpers/handler';
import { auth } from '../middleware/auth';

async function findUsers(req: Request, res: Response, next: NextFunction) {
  res.json([{ user: 'foo' }]);
}

const router = Router();
router.get('/', auth, findUsers);

export const handler = prepareHandler('users', router);
