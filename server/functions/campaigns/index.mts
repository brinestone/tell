import {
  createCampaign,
  createCampaignPublication,
  findCampaignPublications,
  findUserCampaigns
}                         from '@handlers/campaign.mjs';
import { prepareHandler } from '@helpers/handler.mjs';
import { jwtAuth }           from '@middleware/auth.mjs';
import { Router }         from 'express';

const router = Router();
router.get('/', jwtAuth, findUserCampaigns);
router.post('/', jwtAuth, createCampaign);
router.get('/:campaign/publications', jwtAuth, findCampaignPublications);
router.post('/:campaign/publications', jwtAuth, createCampaignPublication);

export const handler = prepareHandler('campaigns', router);
