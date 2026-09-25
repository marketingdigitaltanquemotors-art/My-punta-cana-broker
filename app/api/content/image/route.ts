import { getMediaBucket } from '@/db';

async function mediaResponse(request: Request, includeBody: boolean) {
  const key = new URL(request.url).searchParams.get('key') ?? '';
  if (!key || key.includes('..')) return new Response('Imagen inválida.', { status: 400 });
  const bucket = getMediaBucket();
  if (!includeBody) {
    const metadata = await bucket.head(key);
    if (!metadata) return new Response('Archivo no encontrado.', { status: 404 });
    const headers = new Headers();
    metadata.writeHttpMetadata(headers);
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    headers.set('accept-ranges', 'bytes');
    headers.set('etag', metadata.httpEtag);
    headers.set('content-length', String(metadata.size));
    return new Response(null, { headers });
  }

  const rangeHeader = request.headers.get('range');
  const object = await bucket.get(key, rangeHeader ? { range: request.headers } : undefined);
  if (!object) return new Response('Archivo no encontrado.', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('accept-ranges', 'bytes');
  headers.set('etag', object.httpEtag);
  if (object.range) {
    const range = object.range;
    const length = 'length' in range && range.length ? range.length : 'suffix' in range ? Math.min(range.suffix, object.size) : object.size;
    const offset = 'offset' in range && typeof range.offset === 'number' ? range.offset : Math.max(0, object.size - length);
    headers.set('content-length', String(length));
    headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
    return new Response(object.body, { status: 206, headers });
  }
  headers.set('content-length', String(object.size));
  return new Response(object.body, { headers });
}

export async function GET(request: Request) {
  return mediaResponse(request, true);
}

export async function HEAD(request: Request) {
  return mediaResponse(request, false);
}
