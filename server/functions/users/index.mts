import { prepareHandler }     from '@helpers/handler.mjs';
import { auth }               from '@middleware/auth.mjs';
import { Router }             from 'express';
import { getUserPreferences } from '@handlers/user.mjs';

const router = Router();
router.get('/prefs', auth, getUserPreferences);

export const handler = prepareHandler('users', router);
