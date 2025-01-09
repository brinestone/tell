import { TM_ACCOUNT_ALREADY_EXISTS_MD_MSG, TM_UNKNOWN_COMMAND_MSG } from '@constants/messages/user.mjs';
import { useUsersDb } from '@helpers/db.mjs';
import { handleError } from '@helpers/error.mjs';
import { sendTelegramBotMessage } from '@helpers/telegram.mjs';
import defaultLogger from '@logger/common';
import { accountConnections, users, verificationCodes } from '@schemas/users';
import { TelegramBotCommandUpdateSchema, TelegramChatInfo, TelegramUserInfo } from '@zod-schemas/telegram.mjs';
import { eq, and } from 'drizzle-orm';
import { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import { hashThese } from 'server/util';

export async function onTelegramUpdate(req: Request, res: Response) {
  try {
    const { success, data, error } = TelegramBotCommandUpdateSchema.safeParse(req.body);
    if (!success) {
      console.error(error);
      await sendTelegramBotMessage(Number(req.body.message.chat.id), TM_UNKNOWN_COMMAND_MSG);
      res.status(204).send();
      return;
    }

    const { message } = data;
    const { text, chat, from } = message;
    switch (text.substring(1)) {
      case 'start':
        await handleStartCommand(chat, from);
        break;
      default:
        res.status(404).send('Not found');
        return;
    }

    res.status(204).send();
  } catch (e) {
    handleError(e as Error, res);
  }
}

async function handleStartCommand({ first_name, id }: TelegramChatInfo, tmUser: TelegramUserInfo) {
  const db = useUsersDb();
  const existingConnection = await db.select({
    user: users
  })
    .from(accountConnections)
    .innerJoin(users, () => eq(accountConnections.user, users.id)).where(and(eq(accountConnections.providerId, String(tmUser.id)), eq(accountConnections.provider, 'telegram'), eq(accountConnections.status, 'active')))
    .limit(1);

  if (existingConnection.length > 0) {
    const [{ user: { email, names } }] = existingConnection;
    await sendTelegramBotMessage(id, TM_ACCOUNT_ALREADY_EXISTS_MD_MSG(names, email));
    return;
  }

  const code = randomBytes(3).toString('hex').toUpperCase();
  const hash = hashThese(code);

  await db.transaction(t => t.insert(verificationCodes).values({
    window: '15m',
    hash,
    data: {
      chatId: id,
      userInfo: tmUser
    }
  }));
  defaultLogger.debug('verification code created', 'plaintext', code, 'hash', hash);

  const settingsPageLink = process.env['NODE_ENV'] == 'development' ? `Go to *${process.env['ORIGIN']}/settings*` : `[Click here](${process.env['ORIGIN']}/settings)`;
  const message = `
Hi [${first_name}](tg://user?id=${tmUser.id}), thanks for connecting!

${settingsPageLink} and enter the code below, to completely link your account and start earning your rewards. The code will expire in 15 minutes.

*${code}*
  `;
  await sendTelegramBotMessage(id, message);
}


