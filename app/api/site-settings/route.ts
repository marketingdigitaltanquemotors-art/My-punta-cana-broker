import { getDatabase } from '@/db';

const VIDEO_URL_KEY = 'hero_video_url';
const isValidVideoUrl = (value: string) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

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
  const body = await request.json() as { heroVideoUrl?: string };
  const heroVideoUrl = body.heroVideoUrl?.trim() ?? '';
  if (!isValidVideoUrl(heroVideoUrl)) return Response.json({ error: 'Pega una URL válida que comience con http o https.' }, { status: 400 });
  try {
    await getDatabase().prepare('INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at').bind(VIDEO_URL_KEY, heroVideoUrl, Math.floor(Date.now() / 1000)).run();
    return Response.json({ heroVideoUrl });
  } catch (error) {
    console.error('site_settings_save_error', error);
    return Response.json({ error: 'No pudimos guardar el video. Intenta de nuevo.' }, { status: 503 });
  }
}
