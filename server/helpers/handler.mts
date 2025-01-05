import cookieParser                          from 'cookie-parser';
import express, { json, Router, urlencoded } from 'express';
import context                               from 'express-http-context';
import passport                              from 'passport';
import serverless                            from 'serverless-http';
import logger                                from '@middleware/logger.mjs';

export function prepareHandler(prefix: string, router: Router) {
  const app = express();
  app.use(
    logger,
    context.middleware as unknown as express.Handler,
    json(),
    cookieParser(),
    urlencoded({ extended: true }),
    passport.initialize(),
  );
  app.use(`/api/${prefix}`, router);
  return serverless(app);
}
