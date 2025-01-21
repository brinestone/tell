import { Config, Context } from '@netlify/functions';
import { handleUploads, serveUploadedFile } from '@handlers/blob.mjs';
import { rawAuth } from '@middleware/auth.mjs';

export default async function (req: Request, ctx: Context) {
  if (req.method == 'POST' && ctx.url.pathname == '/api/blob/upload') {
    return await rawAuth(req, ctx, handleUploads);
  } else if (req.method == 'GET' && ctx.url.pathname.startsWith('/api/blob/'))
    return await serveUploadedFile(req, ctx);
  return new Response(null, { status: 404 });
}

export const config: Config = {
  path: [
    '/api/blob/upload', '/api/blob/:key'
  ]
}
