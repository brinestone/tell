import { NextFunction, Request, Response } from 'express';
import defaultLogger                       from '@logger/common';

export default function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const now = Date.now();
    const diff = (now - start) / 1000
    const message = `${req.method} ${req.originalUrl} -> ${res.statusCode} | ${diff}s`;
    if (res.statusCode < 400) {
      defaultLogger.verbose(message, ['duration', diff]);
    } else if (res.statusCode >= 400 && res.statusCode < 500) {
      defaultLogger.warn(message, ['duration', diff]);
    } else {
      defaultLogger.error(message, ['duration', diff]);
    }
  });
  next();
}
