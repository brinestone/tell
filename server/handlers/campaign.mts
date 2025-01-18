import { extractUser } from '@helpers/auth.mjs';
import { useCampaignsDb } from '@helpers/db.mjs';
import { handleError } from '@helpers/error.mjs';
import { LookupCampaignResponse } from '@lib/models/campaign';
import { useLogger } from '@logger/common';
import { CampaignLookupSchema, campaignPublications, campaigns, newCampaignSchema, newPublicationSchema, updateCampaignSchema } from '@schemas/campaigns';
import { CampaignIdExtractorSchema, CampaignLookupPaginationValidationSchema } from '@zod-schemas/campaigns.mjs';
import { and, count, eq } from 'drizzle-orm';
import express from 'express';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

const logger = useLogger({ service: 'campaign' });
const IdExtractorSchema = CampaignIdExtractorSchema('campaign');

export async function deleteCampaign(req: express.Request, res: express.Response) {
  const { success: idValid, data: idInfo } = IdExtractorSchema.safeParse(req.params);
  if (!idValid) {
    logger.warn('id validation failed for campaign delete', { params: req.params });
    res.status(400).json({ message: 'Invalid campaign ID' });
    return;
  }

  logger.info('deleting campaign');
  const { campaign } = idInfo;

  try {
    const user = extractUser(req);
    const db = useCampaignsDb();
    await db.transaction(async t => {
      await t.delete(campaignPublications).where(eq(campaignPublications.campaign, campaign));
      await t.delete(campaigns).where(and(eq(campaigns.id, campaign), eq(campaigns.createdBy, user.id)));
    });
    res.status(200).json({});
  } catch (e) {
    handleError(e as Error, res);
  }
}

export async function updateCampaignInfo(req: express.Request, res: express.Response) {
  const { success: idValid, data: idInfo } = IdExtractorSchema.safeParse(req.params);
  if (!idValid) {
    logger.warn('id validation failed for campaign update', { params: req.params });
    res.status(400).json({ message: 'Invalid campaign ID' });
    return;
  }

  logger.info('updating campaign');
  const { campaign } = idInfo;

  const { success: bodyValid, data: updateData, error: validationError } = updateCampaignSchema.safeParse(req.body);

  if (!bodyValid) {
    logger.warn('body validation failed for campaign update', { data: req.body });
    res.status(400).json({ message: fromZodError(validationError) });
    return;
  }

  const user = extractUser(req);

  try {
    logger.info('updating database', { id: campaign });
    const db = useCampaignsDb();
    const { rowCount } = await db.transaction(t => t.update(campaigns).set(updateData).where(and(eq(campaigns.id, campaign), eq(campaigns.createdBy, user.id))))

    if (rowCount == 0) {
      logger.warn('campaign not found while updating', { id: campaign });
      res.status(404).json({ message: 'Campaign not found' });
    } else {
      logger.info('campaign updated', { id: campaign });
      res.status(202).json({});
    }
  } catch (e) {
    return handleError(e as Error, res);
  }
}

export async function createCampaignPublication(req: express.Request, res: express.Response) {
  const { success, data } = IdExtractorSchema.safeParse(req.params);
  if (!success) {
    res.status(400).json({ message: 'Invalid campaign ID' });
    return;
  }

  const { campaign: campaignId } = data;

  const db = useCampaignsDb();

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
  const { success, data } = IdExtractorSchema.safeParse(req.params);
  if (!success) {
    res.status(400).json({ message: 'Invalid campaign ID' });
    return;
  }

  const { campaign } = data;
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
  const user = extractUser(req);
  const { success, data, error } = newCampaignSchema.safeParse({ ...req.body, createdBy: user.id });
  if (!success) {
    const msg = fromZodError(error).message;
    res.status(400).json({ message: msg });
    return;

  }
  const db = useCampaignsDb();
  try {
    logger.info('creating new campaign');
    await db.transaction(t => t.insert(campaigns).values(data));
    res.status(201).json({});
  } catch (e) {
    handleError(e as Error, res);
  }
}

export async function lookupUserCampaings(req: express.Request, res: express.Response) {
  const db = useCampaignsDb();
  const { page, size } = CampaignLookupPaginationValidationSchema.parse(req.query);
  const user = extractUser(req);
  const data = await db.query.campaigns.findMany({
    columns: {
      id: true,
      title: true,
      updatedAt: true,
      categories: true
    },
    offset: page * size,
    limit: size,
    orderBy: (campaigns, { desc }) => [desc(campaigns.updatedAt)],
    where: (campaigns, { eq }) => eq(campaigns.createdBy, user.id)
  });

  const total = await db.select({ count: count() }).from(campaigns).where(eq(campaigns.createdBy, user.id));

  const responseData = {
    data: z.array(CampaignLookupSchema).parse(data),
    page,
    total: total[0].count,
    size
  } as LookupCampaignResponse;

  res.json(responseData);
}

export async function findUserCampaign(req: express.Request, res: express.Response) {
  const { success, data } = IdExtractorSchema.safeParse(req.params);

  if (!success) {
    res.status(400).json({ message: 'Invalid campaign ID' });
    return;
  }

  const { campaign: id } = data;
  logger.info('fetching campaign', { id });
  const user = extractUser(req);
  try {
    const db = useCampaignsDb();
    const data = await db.query.campaigns.findFirst({
      where: (campaign, { and, eq }) => and(eq(campaign.id, id), eq(campaign.createdBy, user.id))
    });

    if (!data) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    res.json(data);
  } catch (e) {
    handleError(e as Error, res);
  }
}
