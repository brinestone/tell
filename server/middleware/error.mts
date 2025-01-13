import { useLogger } from '@logger/common';
import { NextFunction, Request, Response } from 'express';

const logger = useLogger({ middleware: 'error handler' });
export function errorHandler(error: Error, __: Request, res: Response, _: NextFunction) {
  logger.error('unhandled error', {
    error
  })
  res.status(500).json({ message: error.message });
}
