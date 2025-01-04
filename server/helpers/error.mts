import { Response } from 'express';
import { ZodError } from 'zod';

export function handleError(err: Error, res: Response) {
  if (err instanceof ZodError) {
    res.status(400).json({ message: err.errors.map(z => z.message).join('\n') });
  } else {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
