import {
  createCampaign,
  createCampaignPublication,
  deleteCampaign,
  findCampaignPublications,
  findUserCampaign,
  lookupUserCampaings,
  updateCampaignInfo
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
router.patch('/:campaign', updateCampaignInfo);
router.delete('/:campaign', deleteCampaign);

export const handler = prepareHandler('campaigns', router);
