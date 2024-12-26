import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authorized' });
}
