import { findUserConnections, getUserPreferences, handleTelegramAccountConnectionRemoval, updateUserPreferences, verifyTelegramVerificationCode } from '@handlers/user.mjs';
import { prepareHandler } from '@helpers/handler.mjs';
import { jwtAuth } from '@middleware/auth.mjs';
import { Router } from 'express';

const router = Router();
router.get('/prefs', jwtAuth, getUserPreferences);
router.put('/prefs', jwtAuth, updateUserPreferences);
router.get('/connections', jwtAuth, findUserConnections);
router.get('/connections/verify/tm', jwtAuth, verifyTelegramVerificationCode);
router.get('/connections/disconnect/tm', jwtAuth, handleTelegramAccountConnectionRemoval);

export const handler = prepareHandler('users', router);
