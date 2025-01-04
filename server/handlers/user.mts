import { Request, Response } from 'express';

export async function findUsers(req: Request, res: Response) {
  res.json([{ user: 'foo' }]);
}
