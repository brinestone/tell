import { prepareHandler }                            from '@helpers/handler.mjs';
import { auth }                                      from '@middleware/auth.mjs';
import { Router }                                    from 'express';
import { getUserPreferences, updateUserPreferences } from '@handlers/user.mjs';

const router = Router();
router.get('/prefs', auth, getUserPreferences);
router.put('/prefs', auth, updateUserPreferences);

export const handler = prepareHandler('users', router);
