import { NextFunction, Request, Response } from 'express';

export function errorHandler({ stack, message }: Error, req: Request, res: Response, next: NextFunction) {
  console.log('error handler');
  console.error(stack);
  res.status(500).json({ message });
}
