import { Request, Response, Router } from 'express';
import { prepareHandler }            from '@functions/helpers/handler.mjs';
import { useCampaignsDb }            from '@functions/helpers/db.mjs';
import { auth }                      from '@functions/middleware/auth.mjs';
import { campaigns }                 from '@functions/config/db/schema/campaigns';
import { extractUser }               from '@functions/helpers/auth.mjs';
import { count, eq }                 from 'drizzle-orm';
import { LookupCampaingsResponse }   from '@lib/campaign';

async function createCampaign(req: Request, res: Response) {
  const dto = req.body;
  const db = useCampaignsDb();
  const user = extractUser(req);
  try {
    await db.insert(campaigns).values({ ...dto, createdBy: user.id });
    res.status(201).json({});
    console.log('end');
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: (e as Error).message });
  }
}

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
  } as LookupCampaingsResponse;

  res.json(responseData);
}

const router = Router();
router.get('/', auth, findAll);
router.post('/', auth, createCampaign);

export const handler = prepareHandler('campaigns', router);
