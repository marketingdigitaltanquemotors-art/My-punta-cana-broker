import { getDatabase, getMediaBucket } from '@/db';

const VIDEO_URL_KEY = 'hero_video_url';
const TESTIMONIALS_ENABLED_KEY = 'testimonials_enabled';
const PROJECT_NAME_KEY = 'project_name';
const ACTIVE_PROFILE_KEY = 'active_project_profile_id';
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

async function activeProfileId() {
  const row = await getDatabase().prepare('SELECT value FROM site_settings WHERE key = ?').bind(ACTIVE_PROFILE_KEY).first<{ value: string }>();
  return Number(row?.value) || 1;
}

async function profileIdFromRequest(request: Request) {
  const requestedId = Number(new URL(request.url).searchParams.get('profileId'));
  if (Number.isInteger(requestedId) && requestedId > 0) {
    const profile = await getDatabase().prepare('SELECT id FROM project_profiles WHERE id = ?').bind(requestedId).first<{ id: number }>();
    if (profile) return requestedId;
  }
  return activeProfileId();
}

async function saveProfileSetting(profileId: number, key: string, value: string) {
  return getDatabase().prepare('INSERT INTO project_profile_settings (profile_id, key, value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(profile_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at').bind(profileId, key, value, Math.floor(Date.now() / 1000)).run();
}

export async function GET(request: Request) {
  try {
    const profileId = await profileIdFromRequest(request);
    const result = await getDatabase().prepare('SELECT key, value FROM project_profile_settings WHERE profile_id = ? AND key IN (?, ?, ?)').bind(profileId, VIDEO_URL_KEY, TESTIMONIALS_ENABLED_KEY, PROJECT_NAME_KEY).all<{ key: string; value: string }>();
    const profile = await getDatabase().prepare('SELECT name FROM project_profiles WHERE id = ?').bind(profileId).first<{ name: string }>();
    const profileSettings = Object.fromEntries((result.results ?? []).map(item => [item.key, item.value]));
    const legacyResult = await getDatabase().prepare('SELECT key, value FROM site_settings WHERE key IN (?, ?, ?)').bind(VIDEO_URL_KEY, TESTIMONIALS_ENABLED_KEY, PROJECT_NAME_KEY).all<{ key: string; value: string }>();
    const legacySettings = Object.fromEntries((legacyResult.results ?? []).map(item => [item.key, item.value]));
    const settings = { ...legacySettings, ...profileSettings };
    return Response.json({ profileId, heroVideoUrl: settings[VIDEO_URL_KEY] ?? '', testimonialsEnabled: settings[TESTIMONIALS_ENABLED_KEY] !== 'false', projectName: settings[PROJECT_NAME_KEY] || profile?.name || '' });
  } catch (error) {
    console.error('site_settings_get_error', error);
    return Response.json({ heroVideoUrl: '', testimonialsEnabled: true, projectName: '' });
  }
}

export async function PUT(request: Request) {
  let heroVideoUrl = '';
  let uploadedKey = '';
  const profileId = await activeProfileId();
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
    const body = await request.json() as { heroVideoUrl?: string; testimonialsEnabled?: boolean; projectName?: string };
    const updates: Promise<unknown>[] = [];
    if (typeof body.testimonialsEnabled === 'boolean') {
      updates.push(saveProfileSetting(profileId, TESTIMONIALS_ENABLED_KEY, String(body.testimonialsEnabled)));
    }
    if (typeof body.projectName === 'string') {
      const name = body.projectName.trim();
      updates.push(saveProfileSetting(profileId, PROJECT_NAME_KEY, name));
      if (name) updates.push(getDatabase().prepare('UPDATE project_profiles SET name = ? WHERE id = ?').bind(name, profileId).run());
    }
    if (!('heroVideoUrl' in body)) {
      try {
        await Promise.all(updates);
        return Response.json({ testimonialsEnabled: body.testimonialsEnabled, projectName: typeof body.projectName === 'string' ? body.projectName.trim() : undefined });
      } catch (error) {
        console.error('site_settings_save_error', error);
        return Response.json({ error: 'No pudimos guardar la configuración. Intenta de nuevo.' }, { status: 503 });
      }
    }
    heroVideoUrl = body.heroVideoUrl?.trim() ?? '';
  }
  if (!isValidVideoUrl(heroVideoUrl)) return Response.json({ error: 'Pega una URL válida que comience con http o https.' }, { status: 400 });
  try {
    await saveProfileSetting(profileId, VIDEO_URL_KEY, heroVideoUrl);
    return Response.json({ heroVideoUrl });
  } catch (error) {
    console.error('site_settings_save_error', error);
    if (uploadedKey) await getMediaBucket().delete(uploadedKey).catch(() => {});
    return Response.json({ error: 'No pudimos guardar el video. Intenta de nuevo.' }, { status: 503 });
  }
}
