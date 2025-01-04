import { Response } from 'express';
import { ZodError } from 'zod';

export function handleError(err: Error, res: Response) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.errors.map(({ code, message, path }) => ({ path, message, code })) });
  } else {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
