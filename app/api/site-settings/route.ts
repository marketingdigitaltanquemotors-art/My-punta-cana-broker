import { getDatabase, getMediaBucket } from '@/db';

const VIDEO_URL_KEY = 'hero_video_url';
const videoTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const MAX_VIDEO_SIZE = 80 * 1024 * 1024;
const isValidVideoUrl = (value: string) => {
  if (!value) return true;
  if (value.startsWith('/api/content/image?key=')) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};
const mediaUrl = (key: string) => `/api/content/image?key=${encodeURIComponent(key)}`;

export async function GET() {
  try {
    const result = await getDatabase().prepare('SELECT value FROM site_settings WHERE key = ?').bind(VIDEO_URL_KEY).first<{ value: string }>();
    return Response.json({ heroVideoUrl: result?.value ?? '' });
  } catch (error) {
    console.error('site_settings_get_error', error);
    return Response.json({ heroVideoUrl: '' });
  }
}

export async function PUT(request: Request) {
  let heroVideoUrl = '';
  let uploadedKey = '';
  if (request.headers.get('content-type')?.includes('multipart/form-data')) {
    const form = await request.formData();
    const video = form.get('heroVideo');
    if (!(video instanceof File) || video.size === 0) return Response.json({ error: 'Selecciona un video desde tu PC.' }, { status: 400 });
    if (!videoTypes.has(video.type)) return Response.json({ error: 'El video debe ser MP4, WebM o MOV.' }, { status: 400 });
    if (video.size > MAX_VIDEO_SIZE) return Response.json({ error: 'El video no puede pesar más de 80 MB.' }, { status: 400 });
    const extension = video.type === 'video/quicktime' ? 'mov' : video.type.split('/')[1] ?? 'mp4';
    uploadedKey = `hero-video/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    await getMediaBucket().put(uploadedKey, video.stream(), { httpMetadata: { contentType: video.type } });
    heroVideoUrl = mediaUrl(uploadedKey);
  } else {
    const body = await request.json() as { heroVideoUrl?: string };
    heroVideoUrl = body.heroVideoUrl?.trim() ?? '';
  }
  if (!isValidVideoUrl(heroVideoUrl)) return Response.json({ error: 'Pega una URL válida que comience con http o https.' }, { status: 400 });
  try {
    await getDatabase().prepare('INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at').bind(VIDEO_URL_KEY, heroVideoUrl, Math.floor(Date.now() / 1000)).run();
    return Response.json({ heroVideoUrl });
  } catch (error) {
    console.error('site_settings_save_error', error);
    if (uploadedKey) await getMediaBucket().delete(uploadedKey).catch(() => {});
    return Response.json({ error: 'No pudimos guardar el video. Intenta de nuevo.' }, { status: 503 });
  }
}
