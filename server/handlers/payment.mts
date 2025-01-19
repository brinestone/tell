import { extractUser } from "@helpers/auth.mjs";
import { useFinanceDb } from "@helpers/db.mjs";
import { handleError } from "@helpers/error.mjs";
import { PaymentMethodProviderSchema } from "@lib/models/payment-method-lookup";
import { useLogger } from "@logger/common";
import { paymentMethods } from "@schemas/finance";
import { RemoveMomoPaymentMethodSchema, UpdatePaymentMethodSchema } from "@zod-schemas/payment-method.mjs";
import { and, eq, ne, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { z } from "zod";
import { fromError } from "zod-validation-error";

const logger = useLogger({ service: 'payments' });
const productionProviders = [{ label: 'MTN Mobile Money', name: 'momo', image: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Mtn_mobile_money_logo.png' }];
const devProviders = [{ label: 'Virtual Transfers', name: 'virtual' }];

export async function handleFindPaymentProviders(req: Request, res: Response) {
  const ans: any = [...productionProviders];
  if (req.header('x-nf-deploy-context') === 'dev' || req.header('x-nf-deploy-published') !== '1')
    ans.push(...devProviders);

  res.json(z.array(PaymentMethodProviderSchema).parse(ans));
}

export async function handleRemovePaymentMethod(req: Request, res: Response) {
  logger.info('removing payment method');
  const { success, data, error } = RemoveMomoPaymentMethodSchema.safeParse(req.query);
  if (!success) {
    res.status(400).json({ message: fromError(error).message });
    return;
  }

  const user = extractUser(req);
  const { provider } = data;
  try {
    const result = await removePaymentMethod(user.id, provider);
    res.status(202).json({});
    if (result.rowCount)
      logger.info('removed payment method', 'user', user.id, 'provider', provider);
  } catch (e) {
    handleError(e as Error, res);
  }
}

export async function updatePaymentMethod(req: Request, res: Response) {
  logger.info('upserting payment method');
  const { success, data, error } = UpdatePaymentMethodSchema.safeParse(req.body);
  if (!success) {
    res.status(400).json({ message: fromError(error).message });
    return;
  }

  const { provider, data: params } = data;
  const user = extractUser(req);
  const db = useFinanceDb();
  try {
    await db.transaction(t => {
      return t.insert(paymentMethods).values({
        owner: user.id,
        params,
        provider,
        status: 'active'
      }).onConflictDoUpdate({
        target: [paymentMethods.provider, paymentMethods.owner],
        set: { params: sql.raw(`excluded.${paymentMethods.params.name}`), status: sql.raw(`excluded.${paymentMethods.status.name}`) }
      });
    });
    res.status(202).json({});
    logger.info('upserted payment methods', 'user', user.id, 'provider', provider);
  } catch (e) {
    handleError(e as Error, res);
  }
}

export async function findUserPaymentMethods(req: Request, res: Response) {
  const user = extractUser(req);
  const db = useFinanceDb();
  const paymentMethods = await db.query.paymentMethods.findMany({
    columns: {
      provider: true,
      status: true
    },
    where: (method, { eq }) => {
      if (req.header('x-nf-deploy-context') === 'dev' || req.header('x-nf-deploy-published') !== '1') {
        return eq(method.owner, user.id);
      }
      return and(eq(method.owner, user.id), ne(method.provider, 'virtual'));
    }
  });

  res.json(paymentMethods);
}

export async function doRemovePaymentMethods(userId: number) {
  const db = useFinanceDb();
  return await db.transaction(t => t.delete(paymentMethods).where(eq(paymentMethods.owner, userId))).then(r => r.rowCount);
}

async function removePaymentMethod(userId: number, provider: 'momo') {
  const db = useFinanceDb();
  return await db.transaction(t => t.delete(paymentMethods).where(and(eq(paymentMethods.owner, userId), eq(paymentMethods.provider, provider))));
}

export async function doCreateVirtualPaymentMethod(userId: number) {
  logger.info('creating virtual payment method', { userId });
  const db = useFinanceDb();
  await db.transaction(t => t.insert(paymentMethods).values({
    owner: userId,
    params: { userId },
    provider: 'virtual',
    status: 'active'
  }).onConflictDoNothing({
    target: [paymentMethods.provider, paymentMethods.owner]
  }))
}
