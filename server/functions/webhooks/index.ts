import { Router }           from 'express';
import { prepareHandler }   from '@helpers/handler.mjs';
import { onTelegramUpdate } from '@handlers/webhooks/telegram';

const tmRouter = Router();
tmRouter.post('/', onTelegramUpdate);

const router = Router();
router.use('/tm', tmRouter);

export const handler = prepareHandler('webhooks', router);
