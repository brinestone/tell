import { Router, Request, Response, NextFunction } from 'express';
import { prepareHandler } from '../helpers/handler';
import { ensureAuthenticated } from '../middleware/auth';

async function findUsers(req: Request, res: Response, next: NextFunction) {
  res.json([{ user: 'foo' }]);
}

const router = Router();
router.get('/', ensureAuthenticated, findUsers);

export const handler = prepareHandler('users', router);
