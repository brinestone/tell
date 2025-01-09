import { extractUser } from '@helpers/auth.mjs';
import { useCampaignsDb } from '@helpers/db.mjs';
import { handleError } from '@helpers/error.mjs';
import { LookupCampaignResponse } from '@lib/models/campaign';
import { useLogger } from '@logger/common';
import { campaignPublications, campaigns, newCampaignSchema, newPublicationSchema } from '@schemas/campaigns';
import { count, eq } from 'drizzle-orm';
import express from 'express';

const logger = useLogger({ service: 'campaign' });
export async function createCampaignPublication(req: express.Request, res: express.Response) {
  const db = useCampaignsDb();
  const { campaign: campaignId } = req.params;
  logger.info('creating campaign publication', { campaign: campaignId });
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
    logger.info('created campaign publication', { campaign: campaignId })
    res.status(201).json({});
  } catch (e) {
    handleError(e as Error, res);
  }
}

export async function findCampaignPublications(req: express.Request, res: express.Response) {
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

export async function createCampaign(req: express.Request, res: express.Response) {
  const dto = req.body;
  const db = useCampaignsDb();
  const user = extractUser(req);
  try {
    logger.info('creating new campaign');
    await db.transaction(t => t.insert(campaigns).values(newCampaignSchema.parse({ ...dto, createdBy: user.id })));
    res.status(201).json({});
  } catch (e) {
    handleError(e as Error, res);
  }
}

export async function findUserCampaigns(req: express.Request, res: express.Response) {
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
