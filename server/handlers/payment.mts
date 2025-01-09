import { extractUser } from "@helpers/auth.mjs";
import { useFinanceDb } from "@helpers/db.mjs";
import { handleError } from "@helpers/error.mjs";
import defaultLogger from "@logger/common";
import { paymentMethods } from "@schemas/finance";
import { RemoveMomoPaymentMethodSchema, UpdatePaymentMethodSchema } from "@zod-schemas/payment-method.mjs";
import { and, eq, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { fromError } from "zod-validation-error";

export async function removePaymentMethod(req: Request, res: Response) {
  const { success, data, error } = RemoveMomoPaymentMethodSchema.safeParse(req.query);
  if (!success) {
    res.status(400).json({ message: fromError(error).message });
    return;
  }

  const user = extractUser(req);
  const db = useFinanceDb();
  const { provider } = data;
  try {
    const result = await db.transaction(t => t.delete(paymentMethods).where(and(eq(paymentMethods.owner, user.id), eq(paymentMethods.provider, provider))));
    res.status(202).json({});
    if (result.rowCount)
      defaultLogger.info('removed payment method', 'user', user.id, 'provider', provider);
  } catch (e) {
    handleError(e as Error, res);
  }
}

export async function updatePaymentMethod(req: Request, res: Response) {
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
    defaultLogger.info('upserted payment methods', 'user', user.id, 'provider', provider);
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
    where: (method, { eq }) => eq(method.owner, user.id)
  });

  res.json(paymentMethods);
}
