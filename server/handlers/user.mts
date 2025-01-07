import { Request, Response } from 'express';
import { useUsersDb } from '@helpers/db.mjs';
import { accountConnections, updatePrefSchema, userPrefs, verificationCodes, verificationCodesView } from '@schemas/users';
import { findCountryByIso2Code } from './countries.mjs';
import { extractUser } from '@helpers/auth.mjs';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { hashThese } from 'server/util';
import defaultLogger from '@logger/common';
import { sendTelegramBotMessage } from '@helpers/telegram.mjs';
import { TelegramAccountConnectionDataSchema } from '@zod-schemas/telegram.mjs';
import { TM_USER_ACCOUNT_CONNECTION_VERIFIED_MSG, TM_USER_ACCOUNT_DISCONNECTION_MSG } from '@constants/messages/user.mjs';

const codeVerificationSchema = z.object({
  code: z.string().length(6).transform(arg => hashThese(arg))
});

export async function removeTelegramAccountConnection(req: Request, res: Response) {
  const db = useUsersDb();
  const user = extractUser(req);
  const connection = await db.query.accountConnections.findFirst({
    where: (connection => and(eq(connection.provider, 'telegram'), eq(connection.user, user.id)))
  });
  if (!connection) {
    res.status(404).json({ message: 'Telegram connection not found' });
    return;
  }

  await db.transaction(t => t.delete(accountConnections).where(eq(accountConnections.id, connection.id)));

  const { chatId } = TelegramAccountConnectionDataSchema.parse(connection.params);
  await sendTelegramBotMessage(chatId, TM_USER_ACCOUNT_DISCONNECTION_MSG);

  res.status(202).json({});
}

export async function verifyTelegramVerificationCode(req: Request, res: Response) {
  const params = { ...req.query };
  const { code } = codeVerificationSchema.parse(params);
  const db = useUsersDb();
  const results = await db.select().from(verificationCodesView).where((verificationCode) => and(eq(verificationCode.code, code), eq(verificationCodesView.isExpired, false))).limit(1);
  if (results.length == 0) {
    res.status(404).json({ message: 'Code not found or is expired' });
    return;
  }

  defaultLogger.debug('verification code confirmed', 'hash', code);
  const user = extractUser(req);
  const [{ data }] = results;
  const telegramData = TelegramAccountConnectionDataSchema.parse(data);
  await db.transaction(async t => {
    await t.insert(accountConnections).values({
      user: user.id,
      provider: 'telegram',
      params: data,
      status: 'active',
      providerId: String(telegramData.userInfo.id)
    });

    await t.update(verificationCodes).set({
      confirmed_at: new Date()
    }).where(eq(verificationCodes.hash, code));
  });
  defaultLogger.info('account connection created', 'user', user, 'platform', 'telegram');

  const { chatId } = TelegramAccountConnectionDataSchema.parse(data);
  await sendTelegramBotMessage(chatId, TM_USER_ACCOUNT_CONNECTION_VERIFIED_MSG(user.names));

  res.status(202).json({});
}

export async function findUserConnections(req: Request, res: Response) {
  const db = useUsersDb();
  const user = extractUser(req);
  const connections = await db.query.accountConnections.findMany({
    columns: {
      id: true,
      createdAt: true,
      updatedAt: true,
      provider: true,
      status: true
    },
    where: (connections, { eq }) => eq(connections.user, user.id)
  });
  res.json(connections);
}

export async function updateUserPreferences(req: Request, res: Response) {
  const db = useUsersDb();
  const user = extractUser(req);
  const input = updatePrefSchema.parse(req.body);
  const [{ id }] = await db.transaction(async t => {
    return t.update(userPrefs).set(input).where(eq(userPrefs.user, user.id)).returning({ id: userPrefs.id });
  });

  const prefs = await db.query.userPrefs.findFirst({
    where: (pref, { eq }) => eq(pref.id, id)
  });
  res.json(prefs);
}

export async function getUserPreferences(req: Request, res: Response) {
  const db = useUsersDb();
  const user = extractUser(req);
  const prefs = await db.query.userPrefs.findFirst({
    where: (prefs, { eq }) => eq(prefs.user, user.id)
  });

  res.json(prefs);
}

export async function doCreateUserPreferences(userId: number, countryCode: string) {
  const db = useUsersDb();
  const country = findCountryByIso2Code(countryCode);
  await db.insert(userPrefs).values({
    country: countryCode,
    user: userId,
    currency: country?.currencies?.[0]?.code ?? 'XAF',
    language: country?.languages?.[0]?.iso639_1 ?? 'en'
  });
}
