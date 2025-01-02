import passport                                from 'passport';
import express                                 from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { useUsersDb }                          from '@functions/helpers/db.mjs';

passport.use(new Strategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: String(process.env['JWT_SECRET'])
  },
  async (payload, done) => {
    const { sub } = payload;
    const db = useUsersDb();
    const user = await db.query.users.findFirst({
      where: (users, {eq}) => eq(sub, users.id),
    });
    if (!user) {
      done(new Error('Account not found'));
      return
    }
    done(null, user);
  }
));

export const auth = passport.authenticate('jwt', { session: false }) as express.Handler;
