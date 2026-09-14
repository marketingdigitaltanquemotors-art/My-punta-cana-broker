import { getMediaBucket } from '@/db';

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key') ?? '';
  if (!key || key.includes('..')) return new Response('Imagen inválida.', { status: 400 });
  const object = await getMediaBucket().get(key);
  if (!object) return new Response('Imagen no encontrada.', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}
