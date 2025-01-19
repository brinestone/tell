import { extractUser } from "@helpers/auth.mjs";
import { useFinanceDb } from "@helpers/db.mjs";
import { handleError } from "@helpers/error.mjs";
import { isProduction } from "@helpers/handler.mjs";
import { PaymentMethodProviderSchema } from "@lib/models/payment-method-lookup";
import { useLogger } from "@logger/common";
import { paymentMethods, paymentTransactions } from "@schemas/finance";
import { PaymentMethodProviderName, RemoveMomoPaymentMethodSchema, UpdatePaymentMethodSchema } from "@zod-schemas/payment-method.mjs";
import { and, eq, ne, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { currencyExistsByCode } from "./countries.mjs";
import { PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core";

const logger = useLogger({ service: 'payments' });
const productionProviders = [{ label: 'MTN Mobile Money', name: 'momo', image: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Mtn_mobile_money_logo.png' }];
const devProviders = [{ label: 'Virtual Transfers', name: 'virtual' }];

export async function handleFindPaymentProviders(req: Request, res: Response) {
  const ans: any = [...productionProviders];
  if (!isProduction(req))
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

export async function handleFindUserPaymentMethods(req: Request, res: Response) {
  const user = extractUser(req);
  const paymentMethods = await lookupUserPaymentMethods(user.id, !isProduction(req));

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

export async function lookupUserPaymentMethods(userId: number, enableDevPaymentMethods: boolean) {
  const db = useFinanceDb();
  const paymentMethods = await db.query.paymentMethods.findMany({
    columns: {
      provider: true,
      status: true
    },
    where: (method, { eq }) => {
      if (enableDevPaymentMethods) {
        return eq(method.owner, userId);
      }
      return and(eq(method.owner, userId), ne(method.provider, 'virtual'));
    }
  });

  return paymentMethods;
}

export async function doCollectFunds(t: PgTransaction<PgQueryResultHKT>, user: number, provider: PaymentMethodProviderName, amount: number, currency: string, notes?: string) {
  const db = useFinanceDb();

  const paymentMethod = await db.query.paymentMethods.findFirst({
    columns: {
      params: true
    },
    where: (pm, { eq, and }) => and(eq(pm.owner, user), eq(pm.provider, provider))
  });

  if (!paymentMethod) throw new Error('Payment method not found for provider ' + provider);

  switch (provider) {
    case 'virtual':
      return collectVirtualFunds(amount, currency, t, notes);
    default:
      throw new Error('Payment method unsupported');
  }
}

async function collectVirtualFunds(amount: number, currency: string, t: PgTransaction<PgQueryResultHKT>, notes?: string) {
  const { XAF } = await fetch(new URL(`/api/countries/exchange_rates?src=${currency}&dest=XAF`, process.env['ORIGIN']), { method: 'GET' }).then(res => res.json());
  const convertedAmount = Number((amount * XAF).toFixed(2));
  const [{ transactionId }] = await t.insert(paymentTransactions).values({
    inbound: true,
    currency,
    paymentMethod: 'virtual',
    exchangeRateSnapshot: XAF,
    status: 'complete',
    convertedValue: convertedAmount,
    value: amount,
    notes,
    completedAt: new Date(),
  }).returning({ transactionId: paymentTransactions.id });

  return transactionId;
}
