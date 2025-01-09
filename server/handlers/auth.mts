import { Request, Response } from 'express';
import { SignedUpEvent, UserDeletedEvent } from '@events/user';
import { useAwlClient } from '@helpers/awl-client.mjs';
import { useUsersDb } from '@helpers/db.mjs';
import * as users from '@schemas/users';
import { userSchema } from '@schemas/users';
import { eq } from 'drizzle-orm';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { sign } from 'jsonwebtoken';
import { extractUser } from '@helpers/auth.mjs';
import { handleError } from '@helpers/error.mjs';
import defaultLogger from '@logger/common';

passport.use(new GoogleStrategy({
  clientID: String(process.env['OAUTH2_CLIENT_ID']),
  clientSecret: String(process.env['OAUTH2_CLIENT_SECRET']),
  callbackURL: `${process.env['ORIGIN']}/api/auth/google/callback`,
  passReqToCallback: true
}, async (request, accessToken: string, __: string, profile: Profile, done: VerifyCallback) => {
  const db = useUsersDb();
  let existingUser = await db.query.users.findFirst({
    // where: eq(users.users.credentials, profile.id)
    where: (user, { eq }) => eq(user.credentials, profile.id)
  });
  if (!existingUser) {
    const [{ userId, email }] = await db.transaction(async trx => {
      await trx.insert(users.federatedCredentials).values({
        id: profile.id,
        lastAccessToken: accessToken,
        provider: profile.provider
      })
      return trx.insert(users.users).values({
        credentials: profile.id,
        names: profile.displayName,
        email: profile.emails?.[0].value ?? '',
        imageUrl: profile.photos?.[0].value ?? '',
      }).returning({ userId: users.users.id, email: users.users.email });
    });
    existingUser = await db.query.users.findFirst({ where: eq(users.users.credentials, profile.id) });
    const client = useAwlClient<SignedUpEvent>();
    const eventData = {
      userId,
      email,
      countryCode: request.header('accept-language')?.split(',')?.[0]?.split('-')?.[1] ?? 'CM'
    };
    client.send('accounts.sign-up', {
      data: eventData
    });
  } else {
    await db.transaction(async tx => {
      await tx.update(users.federatedCredentials).set({ lastAccessToken: accessToken }).where(eq(users.federatedCredentials.id, profile.id))
      await tx.update(users.users).set({ updatedAt: new Date() }).where(eq(users.users.credentials, profile.id))
    });
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
    await db.transaction(async t => {
      await t.delete(users.userPrefs).where(eq(users.userPrefs.user, user.id));
    });
    defaultLogger.info('user account deleted', 'user', user.id);
    const client = useAwlClient<UserDeletedEvent>();
    client.send('accounts.deleted', { data: { email: user.email, userId: user.id, credentials: user.credentials as string } });
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

  return res.redirect(`/auth/oauth2/callback?access_token=${jwt}`);
}
