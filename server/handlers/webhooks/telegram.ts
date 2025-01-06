import { Request, Response } from 'express';
import defaultLogger         from '@logger/common';

export async function onTelegramUpdate(req: Request, res: Response) {
  defaultLogger.debug(req.body);
}
