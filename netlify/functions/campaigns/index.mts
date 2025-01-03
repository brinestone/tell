import { Request, Response, Router } from 'express';
import {
  prepareHandler
}                                    from '@functions/helpers/handler.mjs';
import { useCampaignsDb }            from '@functions/helpers/db.mjs';
import {
  auth
}                                    from '@functions/middleware/auth.mjs';
import {
  campaignPublications,
  campaigns,
  newCampaignSchema,
  newPublicationSchema
}                                    from '@functions/config/db/schema/campaigns';
import { extractUser }               from '@functions/helpers/auth.mjs';
import { count, eq }                 from 'drizzle-orm';
import { LookupCampaignResponse }    from '@lib/campaign';
import { handleError }               from '@functions/helpers/error.mjs';

async function findAll(req: Request, res: Response) {
  const db = useCampaignsDb();
  const page = Number(req.query['page'] ?? 0);
  const size = Number(req.query['size'] ?? 10);
  const user = extractUser(req);
  const data = await db.query.campaigns.findMany({
    offset: page * size,
    limit: size,
    orderBy: (campaigns, { desc }) => [desc(campaigns.updatedAt)],
    where: (campaigns, { eq }) => eq(campaigns.createdBy, user.id)
  });

  const total = await db.select({ count: count() }).from(campaigns).where(eq(campaigns.createdBy, user.id));

  const responseData = {
    data,
    page,
    total: total[0].count,
    size
  } as LookupCampaignResponse;

  res.json(responseData);
}

async function createCampaign(req: Request, res: Response) {
  const dto = req.body;
  const db = useCampaignsDb();
  const user = extractUser(req);
  try {
    await db.insert(campaigns).values(newCampaignSchema.parse({ ...dto, createdBy: user.id }));
    res.status(201).json({});
  } catch (e) {
    handleError(e as Error, res);
  }
}

async function findPublications(req: Request, res: Response) {
  const { campaign } = req.params;
  const db = useCampaignsDb();
  try {
    const publications = await db.query.campaignPublications.findMany({
      where: (publication, { eq }) => eq(publication.campaign, Number(campaign)),
      orderBy: (publication, { desc }) => [desc(publication.createdAt)]
    });
    res.json(publications);
  } catch (e) {
    handleError(e as Error, res);
  }
}

async function publishCampaign(req: Request, res: Response) {
  const db = useCampaignsDb();
  const { campaign: campaignId } = req.params;
  const user = extractUser(req);
  try {
    const campaign = await db.query.campaigns.findFirst({
      where: (c, { eq, and }) => and(eq(c.createdBy, user.id), eq(c.id, Number(campaignId)))
    });
    if (!campaign) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }
    const input = newPublicationSchema.parse(req.body);
    await db.insert(campaignPublications).values(input);
    res.status(201).json({});
  } catch (e) {
    handleError(e as Error, res);
  }
}

const router = Router();
router.get('/', auth, findAll);
router.post('/', auth, createCampaign);
router.get('/:campaign/publications', auth, findPublications);
router.post('/:campaign/publications', auth, publishCampaign);

export const handler = prepareHandler('campaigns', router);
