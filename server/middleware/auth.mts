import { Context } from '@netlify/functions';
import { vwAccessTokens } from '@schemas/users';
import { AccessTokenValidationSchema } from '@zod-schemas/user.mjs';
import express, { NextFunction } from 'express';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { useUsersDb } from '../helpers/db.mjs';
import { and, eq } from 'drizzle-orm';
import { extractIp } from '@helpers/ip-extractor';
import { useLogger } from '@logger/common';

const logger = useLogger({ service: 'auth-middleware' });

export function telegramWebhookAuth(req: express.Request, res: express.Response, next: NextFunction) {
  const authHeaderValue = req.header('x-telegram-bot-api-secret-token');
  if (!authHeaderValue || authHeaderValue != String(process.env['TM_WEBHOOK_SECRET'])) {
    res.status(401).send();
    return;
  }
  next();
}

passport.use(new Strategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: String(process.env['JWT_SECRET']),
    audience: String(process.env['ORIGIN']),
    passReqToCallback: true
  },
  async (req: express.Request, payload, done) => {
    logger.debug('validating authentication token')
    try {
      const { sub, tokenId } = payload;
      const ip = extractIp(req);
      const db = useUsersDb();
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(sub, users.id),
      });
      const accessToken = await db.query.accessTokens.findFirst({
        where: (token, { eq, and, isNull }) => and(eq(token.id, tokenId), eq(token.ip, ip), isNull(token.revoked_at))
      });

      if (!accessToken) {
        done(new Error('Invalid access token'), null);
        return;
      }
      if (!user) {
        done(new Error('Account not found'));
        return;
      }
      done(null, user);
    } catch (e) {
      done(e, null);
    }
  }
));

export const jwtAuth = passport.authenticate('jwt', { session: false }) as express.Handler;

export const rawAuth = async (req: Request, ctx: Context, next: (req: Request, ctx: Context) => Promise<Response>) => {
  logger.debug('validating authentication token');
  const headerValue = req.headers.get('authorization')?.split(' ');
  const unauthorizedResponse = new Response(JSON.stringify({ message: 'Unauthorized' }), {
    status: 401,
    headers: { 'content-type': 'application/json' }
  });
  if (!headerValue) return unauthorizedResponse;
  console.log(headerValue);

  const [scheme, token] = headerValue;

  if (scheme !== 'Bearer') return unauthorizedResponse;
  try {
    const { success, data, error } = AccessTokenValidationSchema.safeParse(token);
    if (!success) {
      console.log(error);
      return unauthorizedResponse;
    }

    const db = useUsersDb();
    const result = await db.select().from(vwAccessTokens).where(and(
      eq(vwAccessTokens.user, data.sub),
      eq(vwAccessTokens.ip, ctx.ip),
      eq(vwAccessTokens.is_expired, false),
      eq(vwAccessTokens.id, data.tokenId)
    )).limit(1);

    if (result.length == 0) {
      return unauthorizedResponse;
    }
  } catch (e) {
    console.error(e);
    return unauthorizedResponse;
  }

  return await next(req, ctx);
}
