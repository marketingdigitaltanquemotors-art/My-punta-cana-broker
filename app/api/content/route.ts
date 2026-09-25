import { getDatabase, getMediaBucket } from '@/db';
import { requireAdmin } from '@/lib/admin-auth';
import { cachedMediaUrl, invalidateMemoryCache, SHORT_CACHE_TTL, withMemoryCache } from '@/lib/memory-cache';

type ContentType = 'solar' | 'testimonial';
const allowedTypes = new Set<ContentType>(['solar', 'testimonial']);
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ACTIVE_PROFILE_KEY = 'active_project_profile_id';

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

async function activeProfileId() {
  return withMemoryCache('config:active-profile', SHORT_CACHE_TTL, async () => {
    const row = await getDatabase().prepare('SELECT value FROM site_settings WHERE key = ?').bind(ACTIVE_PROFILE_KEY).first<{ value: string }>();
    return Number(row?.value) || 1;
  });
}

async function profileIdFromRequest(request: Request) {
  const requestedId = Number(new URL(request.url).searchParams.get('profileId'));
  if (Number.isInteger(requestedId) && requestedId > 0) {
    const profile = await getDatabase().prepare('SELECT id FROM project_profiles WHERE id = ?').bind(requestedId).first<{ id: number }>();
    if (profile) return requestedId;
  }
  return activeProfileId();
}

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get('type') as ContentType | null;
  if (type && !allowedTypes.has(type)) return Response.json({ error: 'Tipo de contenido inválido.' }, { status: 400 });
  try {
    const profileId = await profileIdFromRequest(request);
    const items = await withMemoryCache(`media:list:${profileId}:${type ?? 'all'}`, SHORT_CACHE_TTL, async () => {
      const sql = type
        ? 'SELECT c.id, c.type, c.title, c.description, COALESCE(m.key, c.media_key, c.image_key) AS media_key, c.image_url, c.created_at FROM content_items c LEFT JOIN media_items m ON m.key = COALESCE(c.media_key, c.image_key) WHERE c.profile_id = ? AND c.type = ? ORDER BY c.created_at DESC'
        : 'SELECT c.id, c.type, c.title, c.description, COALESCE(m.key, c.media_key, c.image_key) AS media_key, c.image_url, c.created_at FROM content_items c LEFT JOIN media_items m ON m.key = COALESCE(c.media_key, c.image_key) WHERE c.profile_id = ? ORDER BY c.created_at DESC';
      const result = type
        ? await getDatabase().prepare(sql).bind(profileId, type).all<{ id: number; type: ContentType; title: string; description: string; media_key: string; image_url: string; created_at: number }>()
        : await getDatabase().prepare(sql).bind(profileId).all<{ id: number; type: ContentType; title: string; description: string; media_key: string; image_url: string; created_at: number }>();
      return (result.results ?? []).map(({ media_key, image_url, ...item }) => ({
        ...item,
        image_url: media_key ? cachedMediaUrl(media_key) : image_url,
      }));
    });
    return Response.json({ items });
  } catch (error) {
    console.error('content_list_error', error);
    return Response.json({ error: 'No pudimos cargar el contenido.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const form = await request.formData();
  const type = cleanText(form.get('type')) as ContentType;
  const title = cleanText(form.get('title'));
  const description = cleanText(form.get('description'));
  const image = form.get('image');
  if (!allowedTypes.has(type)) return Response.json({ error: 'Selecciona una categoría válida.' }, { status: 400 });
  if (!title) return Response.json({ error: 'Escribe un título o nombre.' }, { status: 400 });
  if (!(image instanceof File) || image.size === 0) return Response.json({ error: 'Sube una foto.' }, { status: 400 });
  if (!imageTypes.has(image.type)) return Response.json({ error: 'La foto debe ser JPG, PNG, WebP o GIF.' }, { status: 400 });
  if (image.size > MAX_IMAGE_SIZE) return Response.json({ error: 'La foto no puede pesar más de 8 MB.' }, { status: 400 });

  const extension = image.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const key = `${type}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const createdAt = Math.floor(Date.now() / 1000);
  try {
    const profileId = await activeProfileId();
    const order = await getDatabase().prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM media_items WHERE profile_id = ? AND kind = ?').bind(profileId, type).first<{ next_order: number }>();
    await getMediaBucket().put(key, image.stream(), { httpMetadata: { contentType: image.type, cacheControl: 'public, max-age=31536000, immutable' } });
    const imageUrl = cachedMediaUrl(key);
    await getDatabase().prepare('INSERT INTO media_items (key, profile_id, kind, filename, content_type, size, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(key, profileId, type, image.name, image.type, image.size, order?.next_order ?? 0).run();
    const result = await getDatabase().prepare('INSERT INTO content_items (profile_id, type, title, description, image_key, image_url, media_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, type, title, description, image_url, created_at').bind(profileId, type, title, description, key, imageUrl, key, createdAt).first();
    invalidateMemoryCache('media:list:', 'media-url:');
    return Response.json({ item: result }, { status: 201 });
  } catch (error) {
    console.error('content_create_error', error);
    await getDatabase().prepare('DELETE FROM media_items WHERE key = ?').bind(key).run().catch(() => {});
    await getMediaBucket().delete(key).catch(() => {});
    return Response.json({ error: 'No pudimos subir el contenido. Intenta de nuevo.' }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: 'Contenido inválido.' }, { status: 400 });
  try {
    const item = await getDatabase().prepare('SELECT COALESCE(media_key, image_key) AS media_key FROM content_items WHERE id = ?').bind(id).first<{ media_key: string }>();
    if (!item) return Response.json({ error: 'Ese contenido no existe.' }, { status: 404 });
    await getDatabase().batch([
      getDatabase().prepare('DELETE FROM content_items WHERE id = ?').bind(id),
      getDatabase().prepare('DELETE FROM media_items WHERE key = ?').bind(item.media_key),
    ]);
    await getMediaBucket().delete(item.media_key);
    invalidateMemoryCache('media:list:', `media-url:${item.media_key}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('content_delete_error', error);
    return Response.json({ error: 'No pudimos borrar el contenido.' }, { status: 503 });
  }
}
