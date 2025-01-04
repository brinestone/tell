import {
  createCampaign,
  createCampaignPublication,
  findCampaignPublications,
  findUserCampaigns
}                         from '@handlers/campaign.mjs';
import { prepareHandler } from '@helpers/handler.mjs';
import { auth }           from '@middleware/auth.mjs';
import { Router }         from 'express';

const router = Router();
router.get('/', auth, findUserCampaigns);
router.post('/', auth, createCampaign);
router.get('/:campaign/publications', auth, findCampaignPublications);
router.post('/:campaign/publications', auth, createCampaignPublication);

export const handler = prepareHandler('campaigns', router);
