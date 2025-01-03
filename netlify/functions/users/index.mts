import { findUserCampaigns } from '@handlers/campaign.mjs';
import { prepareHandler } from '@helpers/handler.mjs';
import { auth } from '@middleware/auth.mjs';
import { Router } from 'express';

const router = Router();
router.get('/', auth, findUserCampaigns);

export const handler = prepareHandler('users', router);
