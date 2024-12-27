import express, { json, Router, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import serverless from 'serverless-http';
import session from 'express-session';
import passport from 'passport';

export function prepareHandler(prefix: string, router: Router) {
  const app = express();
  app.use(
    json(),
    cookieParser(),
    urlencoded({ extended: true }),

    passport.initialize(),
    passport.session()
  );
  app.use(`/api/${prefix}`, router);
  return serverless(app);
}
