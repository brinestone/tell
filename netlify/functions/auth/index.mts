import * as users                                              from '../config/db/schema/users';
import { userSchema }                                          from '../config/db/schema/users';
import { prepareHandler }                                      from '../helpers/handler.mjs';
import { Request, Response, Router }                           from 'express';
import passport                                                from 'passport';
import { Profile, Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import { eq }                                                  from 'drizzle-orm';
import { sign }                                                from 'jsonwebtoken';
import { useUsersDb }                                          from '../helpers/db.mjs';

passport.use(new GoogleStrategy({
  clientID: String(process.env['OAUTH2_CLIENT_ID']),
  clientSecret: String(process.env['OAUTH2_CLIENT_SECRET']),
  callbackURL: `${process.env['ORIGIN']}/api/auth/google/callback`,
}, async (accessToken: string, __: string, profile: Profile, done: VerifyCallback) => {
  const db = useUsersDb();
  let existingUser = await db.query.users.findFirst({
    where: eq(users.users.credentials, profile.id)
  });
  if (!existingUser) {
    await db.transaction(async trx => {
      await trx.insert(users.federatedCredentials).values({
        id: profile.id,
        lastAccessToken: accessToken,
        provider: profile.provider
      })
      await trx.insert(users.users).values({
        credentials: profile.id,
        names: profile.displayName,
        email: profile.emails?.[0].value ?? '',
        imageUrl: profile.photos?.[0].value ?? '',
      }).returning({ id: users.users.id });
    });
    existingUser = await db.query.users.findFirst({ where: eq(users.users.credentials, profile.id) });
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

const router = Router();
router.get('/google', passport.authenticate('google', {
  session: false,
  scope: [
    'profile',
    'email',
  ]
}));
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/auth/login', session: false,
}), (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return
  }

  const user = userSchema.parse(req.user);
  const jwt = sign({
    email: user.email,
    sub: user.id,
    name: user.names,
    image: user.imageUrl,
    aud: String(process.env['ORIGIN'])
  }, String(process.env['JWT_SECRET']), { expiresIn: '1h' });

  return res.redirect(`/auth/oauth2/callback?access_token=${jwt}`);
});

export const handler = prepareHandler('auth', router);
