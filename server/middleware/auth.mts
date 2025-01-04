import passport from 'passport';
import express from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { useUsersDb } from '../helpers/db.mjs';
import { Context } from '@netlify/functions';
import jwt from 'jsonwebtoken';

const { verify } = jwt;

passport.use(new Strategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: String(process.env['JWT_SECRET']),
    audience: String(process.env['ORIGIN'])
  },
  async (payload, done) => {
    const { sub } = payload;
    const db = useUsersDb();
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(sub, users.id),
    });
    if (!user) {
      done(new Error('Account not found'));
      return
    }
    done(null, user);
  }
));

export const auth = passport.authenticate('jwt', { session: false }) as express.Handler;

export const rawAuth = async (req: Request, ctx: Context, next: (req: Request, ctx: Context) => Promise<Response>) => {
  const headerValue = req.headers.get('authorization')?.split(' ');
  const unauthorizedResponse = new Response(JSON.stringify({ message: 'Unauthorized' }), {
    status: 401,
    headers: { 'content-type': 'application/json' }
  });
  if (!headerValue) return unauthorizedResponse;

  const [scheme, token] = headerValue;

  if (scheme !== 'Bearer') return unauthorizedResponse;
  try {
    verify(token, String(process.env['JWT_SECRET']))
  } catch (e) {
    console.error(e);
    return unauthorizedResponse;
  }

  return await next(req, ctx);
}
