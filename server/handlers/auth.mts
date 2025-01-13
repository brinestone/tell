import { extractUser } from '@helpers/auth.mjs';
import { useUsersDb } from '@helpers/db.mjs';
import { handleError } from '@helpers/error.mjs';
import { AccessTokenClaims } from '@lib/models/user';
import { useLogger } from '@logger/common';
import * as users from '@schemas/users';
import { UserSchema } from '@schemas/users';
import { RefreshTokenValidationSchema } from '@zod-schemas/user.mjs';
import { and, eq, isNull } from 'drizzle-orm';
import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { doRemovePaymentMethods } from './payment.mjs';
import { doRemoveAccountConnections } from './user.mjs';
import { doCreateUserWallet, doDeleteUserWallet } from './wallet.mjs';

const logger = useLogger({ service: 'auth' });
passport.use(new GoogleStrategy({
  clientID: String(process.env['OAUTH2_CLIENT_ID']),
  clientSecret: String(process.env['OAUTH2_CLIENT_SECRET']),
  callbackURL: `${process.env['ORIGIN']}/api/auth/google/callback`,
}, async (accessToken: string, __: string, profile: Profile, done: VerifyCallback) => {
  try {
    logger.info('completing oauth2 request');
    const db = useUsersDb();
    let existingUser = await db.query.users.findFirst({
      where: (user, { eq }) => eq(user.credentials, profile.id)
    });

    if (!existingUser) {
      logger.info('creating new user', { email: profile.emails?.[0], provider: 'google' });
      const { userId } = await db.transaction(async trx => {
        await trx.insert(users.federatedCredentials).values({
          id: profile.id,
          lastAccessToken: accessToken,
          provider: profile.provider
        })
        const [userInfo] = await trx.insert(users.users).values({
          credentials: profile.id,
          names: profile.displayName,
          email: profile.emails?.[0].value ?? '',
          imageUrl: profile.photos?.[0].value ?? '',
        }).returning({ userId: users.users.id, email: users.users.email });

        const { userId } = userInfo;
        await trx.insert(users.userPrefs).values({
          country: 'CM',
          currency: 'XAF',
          language: 'en',
          user: userId,
          theme: 'light'
        });

        return userInfo;
      });
      existingUser = await db.query.users.findFirst({ where: eq(users.users.credentials, profile.id) });

      await doCreateUserWallet(userId);
    } else {
      await db.transaction(async tx => {
        await tx.update(users.federatedCredentials).set({ lastAccessToken: accessToken }).where(eq(users.federatedCredentials.id, profile.id))
        await tx.update(users.users).set({ updatedAt: new Date() }).where(eq(users.users.credentials, profile.id))
      });
      logger.info('updated user credential', { email: profile.emails?.[0], provider: 'google' });
    }
    return done(null, existingUser);
  } catch (e) {
    logger.error('error while handling google sign in', { error: e });
    return done(e, undefined);
  }
}));

passport.serializeUser<number>((user, done) => {
  return done(null, UserSchema.parse(user).id);
});

passport.deserializeUser<number>((id, done) => {
  const db = useUsersDb();
  db.query.users.findFirst({ where: eq(users.users.id, id) })
    .then(user => done(null, user ?? null), (err) => done(err, null));
});

export async function removeUserAccount(req: Request, res: Response) {
  const user = extractUser(req);
  const db = useUsersDb();
  try {
    logger.info('deleting user account', { userId: user.id });
    logger.info('deleting user preferences', { userId: user.id });
    await db.transaction(async t => {
      await t.delete(users.userPrefs).where(eq(users.userPrefs.user, user.id));
    });
    logger.info('deleting user wallet', { userId: user.id });
    await doDeleteUserWallet(user.id);
    logger.info('deleting user account connections', { userId: user.id });
    await doRemoveAccountConnections(user.id);
    logger.info('deleting user payment methods', { userId: user.id });
    await doRemovePaymentMethods(user.id);
    logger.info('deleting user credentials and user account record', { userId: user.id });
    await db.transaction(t => Promise.all([
      t.delete(users.users).where(eq(users.users.id, user.id)),
      t.delete(users.federatedCredentials).where(eq(users.federatedCredentials.id, user.credentials as string))
    ]));
    logger.info('user account deleted', { userId: user, email: user.email });

    res.status(202).send({});
  } catch (e) {
    handleError(e as Error, res);
  }
}

export const handleGoogleSignIn = passport.authenticate('google', { session: false, scope: ['profile', 'email'] });

export function handleGoogleOauthCallback({ failureRedirect }: { failureRedirect: string }) {
  return passport.authenticate('google', { failureRedirect, session: false })
}

export async function handleUserSignIn(req: Request, res: Response) {
  logger.info('signing in user');
  const ip = String(req.header('client-ip'));

  try {
    const { success, data } = UserSchema.safeParse(req.user)
    if (!success) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = data;

    logger.info('generating refresh token', { email: user.email });
    const refreshToken = randomBytes(16).toString('hex');
    const db = useUsersDb();
    const { accessTokenId, refreshTokenId } = await db.transaction(async t => {
      const [{ accessTokenId }] = await t.insert(users.accessTokens).values({
        ip,
        user: user.id,
        window: String(process.env['JWT_LIFETIME'])
      }).returning({ accessTokenId: users.accessTokens.id });

      const [{ refreshTokenId }] = await t.insert(users.refreshTokens).values({
        window: String(process.env['REFRESH_TOKEN_LIFETIME']),
        ip,
        token: refreshToken,
        user: user.id,
        access_token: accessTokenId
      }).returning({ refreshTokenId: users.refreshTokens.id });

      return { accessTokenId, refreshTokenId };
    });

    logger.info('generated token pair');

    const signedAccessToken = sign({
      email: user.email,
      sub: user.id,
      name: user.names,
      image: user.imageUrl,
      aud: String(process.env['ORIGIN']),
      tokenId: accessTokenId
    }, String(process.env['JWT_SECRET']), { expiresIn: process.env['JWT_LIFETIME'] })

    const signedRefreshToken = sign({
      value: refreshToken,
      tokenId: refreshTokenId
    }, String(process.env['JWT_SECRET']), {
      expiresIn: process.env['REFRESH_TOKEN_LIFETIME']
    });

    logger.info('Signed in user', { email: user.email });
    res.redirect(`/auth/oauth2/callback?access=${signedAccessToken}&refresh=${signedRefreshToken}`)
  } catch (e) {
    handleError(e as Error, res);
  }
}

export async function handleTokenRefresh(req: Request, res: Response) {
  const ip = String(req.header('client-ip'));
  try {
    logger.info('refreshing tokens');
    const { success, data, error } = RefreshTokenValidationSchema.safeParse(req.query);

    if (!success) {
      logger.error("refresh token validation error", { error });
      res.status(403).json({ message: 'Invalid refresh token' });
      return;
    }

    const { token: refreshToken } = data;

    const db = useUsersDb();
    const existingRefreshTokenResult = await db.select().from(users.vwRefreshTokens).where(
      and(
        eq(users.vwRefreshTokens.id, refreshToken.tokenId),
        eq(users.vwRefreshTokens.isExpired, false),
        eq(users.vwRefreshTokens.token, refreshToken.value),
        isNull(users.vwRefreshTokens.replaced_by),
        isNull(users.vwRefreshTokens.revoked_by),
        eq(users.vwRefreshTokens.ip, ip)
      ))
      .limit(1);

    if (existingRefreshTokenResult.length == 0) {
      res.status(403).json({ message: 'Invalid refresh token' });
      return;
    }

    const [existingRefreshToken] = existingRefreshTokenResult;
    const existingAccessTokenResult = await db.select().from(users.accessTokens).where(eq(users.accessTokens.id, existingRefreshToken.access_token));

    if (existingAccessTokenResult.length == 0) {
      res.status(403).json({ message: 'Invalid refresh token' });
      return;
    }

    const [existingAccessToken] = existingAccessTokenResult;

    const userResult = await db.select().from(users.users).where(eq(users.users.id, existingRefreshToken.user));
    if (userResult.length == 0) {
      res.status(403).json({ message: 'Invalid refresh token' });
      return;
    }

    const [user] = userResult;
    logger.info('existing refresh token validated', { email: user.email });

    const newRefreshToken = randomBytes(16).toString('hex');

    logger.info('updating database');
    const { accessTokenId, refreshTokenId } = await db.transaction(async t => {
      const [{ accessTokenId }] = await t.insert(users.accessTokens).values({
        ip,
        user: user.id,
        window: String(process.env['JWT_LIFETIME'])
      }).returning({ accessTokenId: users.accessTokens.id });

      await t.update(users.accessTokens).set({
        replacedBy: accessTokenId
      }).where(eq(users.accessTokens.id, existingAccessToken.id))

      const [{ refreshTokenId }] = await t.insert(users.refreshTokens).values({
        window: String(process.env['REFRESH_TOKEN_LIFETIME']),
        ip,
        token: newRefreshToken,
        user: user.id,
        access_token: accessTokenId
      }).returning({ refreshTokenId: users.refreshTokens.id });

      await t.update(users.refreshTokens).set({
        replaced_by: refreshTokenId
      }).where(eq(users.refreshTokens.id, existingRefreshToken.id));

      return { accessTokenId, refreshTokenId };
    });

    const claims = {
      email: user.email,
      sub: user.id,
      name: user.names,
      image: user.imageUrl,
      tokenId: accessTokenId,
      aud: String(process.env['ORIGIN'])
    } as AccessTokenClaims;

    logger.info('signing new access token for user', { email: user.email });
    const signedAccessToken = sign(claims, String(process.env['JWT_SECRET']), { expiresIn: process.env['JWT_LIFETIME'] ?? '15m' });

    logger.info('signing replacement refresh token', { email: user.email });
    const signedRefreshToken = sign({
      value: newRefreshToken,
      tokenId: refreshTokenId
    }, String(process.env['JWT_SECRET']), { expiresIn: process.env['REFRESH_TOKEN_LIFETIME'] ?? '90d' })

    res.json({ access: signedAccessToken, refresh: signedRefreshToken });
  } catch (e) {
    handleError(e as Error, res);
  }
}

export async function handleRevokeAccessToken(req: Request, res: Response) {
  try {
    const user = extractUser(req);
    logger.info('Revoking tokens', { email: user.email });

    const { success, data } = RefreshTokenValidationSchema.safeParse(req.query);
    if (!success) {
      res.status(403).json({ message: 'Invalid token' });
      return
    }

    const { token: { tokenId, value: tokenValue } } = data;
    const db = useUsersDb();
    const refreshTokenResult = await db.select().from(users.vwRefreshTokens).where(
      and(
        eq(users.vwRefreshTokens.id, tokenId),
        eq(users.vwRefreshTokens.token, tokenValue),
        eq(users.vwRefreshTokens.isExpired, false),
        eq(users.vwRefreshTokens.user, user.id)
      )
    ).limit(1);

    if (refreshTokenResult.length == 0) {
      res.status(403).json({ message: 'Invalid tokens' });
      return;
    }

    const [refreshToken] = refreshTokenResult
    logger.info('tokens valid. updating database');
    await db.transaction(async t => {
      await t.update(users.accessTokens).set({ revoked_at: new Date() }).where(eq(users.accessTokens.id, refreshToken.access_token));
      await t.update(users.refreshTokens).set({ revoked_by: user.id }).where(eq(users.refreshTokens.id, refreshToken.id));
    });

    logger.info('tokens revoked');
    res.status(204).json({});
  } catch (e) {
    handleError(e as Error, res);
  }
}
