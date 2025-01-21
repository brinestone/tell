import defaultLogger from '@logger/common';
import { Response } from 'express';
import { ZodError } from 'zod';
import { fromError } from 'zod-validation-error';

export function handleError(err: Error, res: Response) {
  if (err instanceof ZodError) {
    res.status(400).json({ message: fromError(err).message });
  } else {
    defaultLogger.error('handled error', { error: err });
    res.status(500).json({ message: 'Internal server error' });
  }
}
