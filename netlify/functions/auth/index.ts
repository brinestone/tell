import * as users from '../config/db/schema/users';
import { userSchema } from '../config/db/schema/users';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { prepareHandler } from '../helpers/handler';
import { Request, Response, Router } from 'express';
import passport from 'passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { eq } from 'drizzle-orm';

const db = drizzle({
  schema: { ...users },
  connection: String(process.env['DATABASE_URL'])
})

passport.use(new Strategy({
  clientID: String(process.env['OAUTH2_CLIENT_ID']),
  clientSecret: String(process.env['OAUTH2_CLIENT_SECRET']),
  callbackURL: `${process.env['BASE_URL']}/api/auth/google/callback`,
  // passReqToCallback: true
}, async (access: string, refresh: string, profile: Profile, done: VerifyCallback) => {
  let existingUser = await db.query.users.findFirst({
    where: eq(users.users.credentials, profile.id)
  });
  if (!existingUser) {
    await db.transaction(async trx => {
      await trx.insert(users.federatedCredentials).values({
        id: profile.id,
        provider: profile.provider
      })
      await trx.insert(users.users).values({
        credentials: profile.id,
        names: profile.displayName,
        email: profile.emails?.[0].value ?? '',
        imageUrl: profile.photos?.[0].value ?? '',
      }).returning({ id: users.users.id });
    });
    existingUser = await db.query.users.findFirst({ where: eq(users.users.credentials, profile.id) })

  }

  return done(null, existingUser);
}));

passport.serializeUser<number>((user, done) => {
  return done(null, userSchema.parse(user).id);
});

passport.deserializeUser<number>((id, done) => {
  done(null, { id })
});

const router = Router();
router.get('/', passport.authenticate('google', {
  scope: [
    'profile',
    'email',
  ]
}));
router.get('/callback', passport.authenticate('google', {
  failureRedirect: '/auth/login',
  successRedirect: '/'
}), (req: Request, res: Response) => {

  res.status(200);
});

export const handler = prepareHandler('auth/google', router);
