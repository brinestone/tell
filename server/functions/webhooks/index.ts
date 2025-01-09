import { Router } from 'express';
import { prepareHandler } from '@helpers/handler.mjs';
import { onTelegramUpdate } from '@handlers/webhooks/telegram';
import { telegramWebhookAuth } from '@middleware/auth.mjs';

const tmRouter = Router();
tmRouter.post('/', telegramWebhookAuth, onTelegramUpdate);

const router = Router();
router.use('/tm', tmRouter);

export const handler = prepareHandler('webhooks', router);
