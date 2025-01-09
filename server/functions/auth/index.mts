import { handleGoogleOauthCallback, handleGoogleSignIn, handleUserSignIn, removeUserAccount } from '@handlers/auth.mjs';
import { prepareHandler } from '@helpers/handler.mjs';
import { jwtAuth } from '@middleware/auth.mjs';
import { Router } from 'express';


const router = Router();
router.get('/google', handleGoogleSignIn);
router.get('/google/callback', handleGoogleOauthCallback({ failureRedirect: '/auth/login' }), handleUserSignIn);
router.delete('/', jwtAuth, removeUserAccount);

export const handler = prepareHandler('auth', router);
