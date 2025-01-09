import { extractUser } from '@helpers/auth.mjs';
import { useUsersDb } from '@helpers/db.mjs';
import { handleError } from '@helpers/error.mjs';
import { useLogger } from '@logger/common';
import * as users from '@schemas/users';
import { userSchema } from '@schemas/users';
import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { doRemovePaymentMethods } from './payment.mjs';
import { doRemoveAccountConnections } from './user.mjs';
import { doCreateUserWallet, doDeleteUserWallet } from './wallet.mjs';

const logger = useLogger({ handler: 'auth' });
passport.use(new GoogleStrategy({
  clientID: String(process.env['OAUTH2_CLIENT_ID']),
  clientSecret: String(process.env['OAUTH2_CLIENT_SECRET']),
  callbackURL: `${process.env['ORIGIN']}/api/auth/google/callback`,
}, async (accessToken: string, __: string, profile: Profile, done: VerifyCallback) => {
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
}));

passport.serializeUser<number>((user, done) => {
  return done(null, userSchema.parse(user).id);
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

export function handleUserSignIn(req: Request, res: Response) {
  logger.info('signing in user');
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = userSchema.parse(req.user);
  const jwt = sign({
    email: user.email,
    sub: user.id,
    name: user.names,
    image: user.imageUrl,
    aud: String(process.env['ORIGIN'])
  }, String(process.env['JWT_SECRET']), { expiresIn: process.env['JWT_LIFETIME'] ?? '1h' });

  logger.info('signed in user', { email: user.email });
  return res.redirect(`/auth/oauth2/callback?access_token=${jwt}`);
}
