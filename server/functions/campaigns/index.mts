import {
  createCampaign,
  createCampaignPublication,
  findCampaignPublications,
  findUserCampaign,
  lookupUserCampaings
} from '@handlers/campaign.mjs';
import { prepareHandler } from '@helpers/handler.mjs';
import { jwtAuth } from '@middleware/auth.mjs';
import { Router } from 'express';

const router = Router();
router.use(jwtAuth);

router.get('/', lookupUserCampaings);
router.post('/', createCampaign);
router.get('/:campaign/publications', findCampaignPublications);
router.post('/:campaign/publications', createCampaignPublication);
router.get('/:campaign', findUserCampaign);

export const handler = prepareHandler('campaigns', router);
