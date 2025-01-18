import { useLogger } from "@logger/common";
import { getStore, Store } from "@netlify/blobs";
import { Context } from "@netlify/functions";
import ffmpeg from 'fluent-ffmpeg';
import { Jimp } from 'jimp';
import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from 'node:stream';

const logger = useLogger({ service: 'blobs' });

export async function serveUploadedFile(event: Request, ctx: Context) {
  // const key = ctx.params['key'].substring(0, ctx.params['key'].lastIndexOf('.'));
  const [key] = ctx.url.pathname.split('/')[3]?.split('.');
  // const isPreviewRequested = !url.searchParams.has('preview') || url.searchParams.get('preview') != null || url.searchParams.get('preview') == 'true';

  logger.info('serving blob file', { key });
  if (!key) {
    return new Response(null, { status: 404 });
  }

  // if (!isPreviewRequested) {
  return await serveFileFromUploadStore(key);
  // }

  // return await serveFileFromPreviewStores(key, extension);
}

async function serveFileFromPreviewStores(key: string, extension: string) {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".tiff", ".tif"];
  logger.debug('serving file from preview stores', { key });

  let store: Store
  if (imageExtensions.includes(extension)) {
    logger.debug('using thumbnail store', { key });
    store = getStore({
      name: 'thumbnails', consistency: 'strong'
    });
  } else {
    logger.debug('using previews store', { key });
    store = getStore({
      name: 'previews', consistency: 'strong'
    });
  }

  return await getFileFromStore(store, key);
}

async function serveFileFromUploadStore(key: string) {
  logger.info('serving file from upload store', { key });

  const store = getStore({
    name: 'uploads', consistency: 'strong'
  });

  return await getFileFromStore(store, key);
}

async function getFileFromStore(store: Store, key: string) {
  const result = await store.getWithMetadata(key, { type: 'stream' });
  if (!result) return new Response(null, { status: 404 });
  const { data, metadata } = result;
  return new Response(data, { headers: { 'content-type': metadata['mimetype'] as string } });
}

export async function handleUploads(req: Request, ctx: Context) {
  logger.info('handling file upload');

  const urls = Array<string>();
  const data = await req.formData();
  const entries = data.getAll('uploads');

  if (entries.length <= 0) {
    return new Response(JSON.stringify({ message: 'Empty uploads' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  const uploadStore = getStore({
    name: 'uploads',
    consistency: 'strong'
  });

  // const thumbnailStore = getStore({
  //   name: 'thumbnails',
  //   consistency: 'strong'
  // });

  // const previewStore = getStore({
  //   name: 'previews',
  //   consistency: 'strong'
  // });

  for await (const entry of entries) {
    const file = entry as File;
    const [r1, r2] = file.stream().tee();
    const buff = await streamToBuffer(r2);

    const extension = file.name.substring(file.name.lastIndexOf('.'));
    const fileKey = await computeBlobStoreKey(r1);

    const storeMetadata = {
      mimeType: file.type,
      originalName: file.name,
      size: file.size
    } as Record<string, any>;

    // if (file.type.startsWith('image')) {
    //   const thumbnail = await generateThumbnail(buff, extension);

    //   await thumbnailStore.set(fileKey, thumbnail, {
    //     metadata: {
    //       ...storeMetadata,
    //       size: thumbnail.byteLength
    //     } as Record<string, any>
    //   });
    // }

    // if (file.type.startsWith('video')) {
    //   const preview = await generatePreviewVideo(buff);

    //   await previewStore.set(fileKey, preview, {
    //     metadata: {
    //       ...storeMetadata,
    //       size: preview.byteLength
    //     }
    //   });
    // }

    await uploadStore.set(fileKey, buff, { metadata: storeMetadata });
    const url = `${ctx.url.origin}/api/blob/${fileKey}${extension}`;
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

async function generateThumbnail(buffer: Buffer, ext: string) {
  const j = await Jimp.read(buffer);
  const tmp = join(tmpdir(), randomUUID());
  j.resize({ w: 150, h: 150 });
  await j.write(`${tmp}.${ext}`);

  return await readFile(`${tmp}.${ext}`)
}

async function computeBlobStoreKey(input: ReadableStream<Uint8Array<ArrayBufferLike>> | Buffer) {
  const cipher = createHash('md5');
  if (Buffer.isBuffer(input)) {
    cipher.update(input);
  } else {
    for await (const chunk of input) {
      cipher.update(chunk);
    }
  }
  return cipher.digest('hex');
}

async function generatePreviewVideo(video: ReadableStream<Uint8Array<ArrayBuffer>> | Buffer) {
  logger.info('generating video preview');
  const tmp = join(tmpdir(), randomUUID());
  await writeFile(tmp, video)

  const { durationInSeconds, size } = await getVideoInfo(tmp);
  const fragmentDuration = Number(process.env['VIDEO_PREVIEW_DURATION'] ?? 4);
  const startTimeInSeconds = getStartTimeInSeconds(durationInSeconds, fragmentDuration);

  const output = new BufferStream();

  await new Promise((resolve, reject) => {
    ffmpeg()
      .addInput(tmp)
      .inputOptions([`-ss ${startTimeInSeconds}`])
      .outputOptions([`-t ${fragmentDuration}`])
      .noAudio()
      .output(output)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  return output.getBuffer();
}

function getStartTimeInSeconds(totalDuration: number, fragmentDuration: number) {
  const safeDuration = Math.max(totalDuration - fragmentDuration, 0);

  if (safeDuration == 0) return 0;

  const min = Math.ceil(.25 * safeDuration);
  const max = Math.floor(.75 * safeDuration);

  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getVideoInfo(path: string) {
  return new Promise<{ durationInSeconds: number, size: number }>((resolve, reject) => {
    return ffmpeg.ffprobe(path, (err, info) => {
      if (err) {
        return reject(err);
      }

      const { duration, size } = info.format;

      if (duration === undefined || size === undefined) {
        return reject(new Error('invalid size or duration'));
      }

      return resolve({
        size,
        durationInSeconds: Math.floor(duration)
      })
    })
  });
}

class BufferStream extends Writable {
  private buffer = Array<Uint8Array>();

  override _write(chunk: Uint8Array, encoding: string, callback: () => void) {
    this.buffer.push(chunk);
    callback();
  }

  getBuffer() {
    return Buffer.concat(this.buffer);
  }
}
