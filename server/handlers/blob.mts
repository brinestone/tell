import { useLogger } from "@logger/common";
import { getStore } from "@netlify/blobs";
import { Context } from "@netlify/functions";
import { createHash } from "node:crypto";

const logger = useLogger({ service: 'blobs' });
export async function serveUploadedFile(_: Request, ctx: Context) {
  const key = ctx.url.pathname.split('/')[3]?.split('.')[0];
  logger.info('serving blob file', { key });
  if (!key) {
    return new Response(null, { status: 404 });
  }
  const uploadStore = getStore({
    name: 'userUploads', consistency: 'strong'
  });

  const result = await uploadStore.getWithMetadata(key, { type: 'stream' });
  if (!result) return new Response(null, { status: 404 });
  const { data, metadata } = result;
  return new Response(data, { headers: { 'content-type': metadata['mimeType'] as string } });
}

export async function handleUploads(req: Request, ctx: Context) {
  logger.info('handling file upload');
  const urls = Array<string>();
  const data = await req.formData();
  const entries = data.getAll('uploads');

  if (entries.length <= 0) {
    return new Response(JSON.stringify({ message: 'Empty uploads' }), {
      status: 404,
      headers: { 'content-type': 'application/json' }
    });
  }

  const uploadStore = getStore({
    name: 'userUploads',
    consistency: 'strong'
  });

  for await (const entry of entries) {
    const file = entry as File;
    const cipher = createHash('md5');
    const [r1, r2] = file.stream().tee();
    const buff = await streamToBuffer(r2);

    for await (const chunk of r1) {
      cipher.update(chunk);
    }

    const key = cipher.digest().toString('hex');

    const extension = file.name.split('.')[1];
    await uploadStore.set(key, buff, {
      metadata: {
        mimeType: file.type,
        originalName: file.name,
        size: file.size
      }
    });
    const url = `${ctx.url.origin}/api/blob/${key}.${extension}`;
    urls.push(url);
  }

  return new Response(JSON.stringify(urls), { headers: { 'content-type': 'application/json' }, status: 202 });
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>) {
  const chunks = Array<Uint8Array>();
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally {
    reader.releaseLock();
  }
}
