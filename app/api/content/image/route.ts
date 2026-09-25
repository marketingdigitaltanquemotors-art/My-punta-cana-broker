import { getMediaBucket } from '@/db';

function requestedRange(value: string | null, size: number) {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match) return false;
  const [, startText, endText] = match;
  if (!startText && !endText) return false;
  if (!startText) {
    const suffixLength = Number(endText);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return false;
    const length = Math.min(suffixLength, size);
    return { offset: size - length, length };
  }
  const offset = Number(startText);
  const requestedEnd = endText ? Number(endText) : size - 1;
  if (!Number.isFinite(offset) || !Number.isFinite(requestedEnd) || offset < 0 || requestedEnd < offset || offset >= size) return false;
  const end = Math.min(requestedEnd, size - 1);
  return { offset, length: end - offset + 1 };
}

async function mediaResponse(request: Request, includeBody: boolean) {
  const key = new URL(request.url).searchParams.get('key') ?? '';
  if (!key || key.includes('..')) return new Response('Imagen inválida.', { status: 400 });
  const bucket = getMediaBucket();
  const metadata = await bucket.head(key);
  if (!metadata) return new Response('Archivo no encontrado.', { status: 404 });
  const range = requestedRange(request.headers.get('range'), metadata.size);
  const headers = new Headers();
  metadata.writeHttpMetadata(headers);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('accept-ranges', 'bytes');
  headers.set('etag', metadata.httpEtag);
  if (range === false) {
    headers.set('content-range', `bytes */${metadata.size}`);
    return new Response(null, { status: 416, headers });
  }
  if (!includeBody) {
    headers.set('content-length', String(metadata.size));
    return new Response(null, { headers });
  }
  const object = await bucket.get(key, range ? { range } : undefined);
  if (!object) return new Response('Archivo no encontrado.', { status: 404 });
  if (range) {
    headers.set('content-length', String(range.length));
    headers.set('content-range', `bytes ${range.offset}-${range.offset + range.length - 1}/${metadata.size}`);
    return new Response(object.body, { status: 206, headers });
  }
  headers.set('content-length', String(metadata.size));
  return new Response(object.body, { headers });
}

export async function GET(request: Request) {
  return mediaResponse(request, true);
}

export async function HEAD(request: Request) {
  return mediaResponse(request, false);
}
