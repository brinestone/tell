import { handleGoogleOauthCallback, handleGoogleSignIn, handleUserSignIn } from '@handlers/auth.mjs';
import { prepareHandler } from '@helpers/handler.mjs';
import { Router } from 'express';


const router = Router();
router.get('/google', handleGoogleSignIn);
router.get('/google/callback', handleGoogleOauthCallback({ failureRedirect: '/auth/login' }), handleUserSignIn);

export const handler = prepareHandler('auth', router);
