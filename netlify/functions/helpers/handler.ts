import express, { json, Router, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import serverless from 'serverless-http';
import passport from 'passport';
import context from 'express-http-context'

export function prepareHandler(prefix: string, router: Router) {
  const app = express();
  app.use(
    context.middleware as unknown as express.Handler,
    json(),
    cookieParser(),
    urlencoded({ extended: true }),
    passport.initialize(),
  );
  app.use(`/api/${prefix}`, router);
  return serverless(app);
}
