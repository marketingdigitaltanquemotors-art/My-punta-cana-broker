import { getDatabase, getMediaBucket } from '@/db';

const VIDEO_URL_KEY = 'hero_video_url';
const TESTIMONIALS_ENABLED_KEY = 'testimonials_enabled';
const PROJECT_NAME_KEY = 'project_name';
const ACTIVE_PROFILE_KEY = 'active_project_profile_id';
const TEXT_DEFAULTS = {
  heroEyebrow: 'PUNTA CANA · BÁVARO',
  heroTitle: 'Encuentra tu solar en el centro de Punta Cana-Bávaro, cerca de todo.',
  heroSubtitle: 'Agenda una visita personalizada en Punta Cana-Bávaro de manera rápida y sencilla.',
  offerOne: 'Desde un 15%',
  offerTwo: 'Desde 150$ por mentro',
  builtKicker: 'CASAS CONSTRUIDAS',
  builtTitle: 'Imagina tu casa hecha realidad en Punta Cana-Bávaro.',
  builtText: 'Estos solares son una oportunidad para construir cerca de todo, con una visión clara de comunidad, acceso y futuro crecimiento.',
  solaresKicker: 'SOLARES',
  solaresTitle: 'Fotos de solares disponibles',
  solaresEmpty: 'Muy pronto verás nuevas fotos de solares.',
  testimonialsKicker: 'TESTIMONIOS',
  testimonialsTitle: 'Testimonio de clientes en sus solares',
  testimonialsEmpty: 'Muy pronto compartiremos testimonios de nuestros clientes.',
  visitKicker: 'CONOCE EL LUGAR',
  visitTitle: 'Tu próximo proyecto comienza con una visita.',
  footerTagline: 'Solares y terrenos en Punta Cana-Bávaro',
  footerSlogan: 'Invierte en tierra. Construye tu futuro.'
};
const TEXT_KEYS = Object.keys(TEXT_DEFAULTS);
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
    const wantedKeys = [VIDEO_URL_KEY, TESTIMONIALS_ENABLED_KEY, PROJECT_NAME_KEY, ...TEXT_KEYS.map(key => `text_${key}`)];
    const placeholders = wantedKeys.map(() => '?').join(',');
    const result = await getDatabase().prepare(`SELECT key, value FROM project_profile_settings WHERE profile_id = ? AND key IN (${placeholders})`).bind(profileId, ...wantedKeys).all<{ key: string; value: string }>();
    const profile = await getDatabase().prepare('SELECT name FROM project_profiles WHERE id = ?').bind(profileId).first<{ name: string }>();
    const profileSettings = Object.fromEntries((result.results ?? []).map(item => [item.key, item.value]));
    const legacyResult = await getDatabase().prepare('SELECT key, value FROM site_settings WHERE key IN (?, ?, ?)').bind(VIDEO_URL_KEY, TESTIMONIALS_ENABLED_KEY, PROJECT_NAME_KEY).all<{ key: string; value: string }>();
    const legacySettings = Object.fromEntries((legacyResult.results ?? []).map(item => [item.key, item.value]));
    const settings = { ...legacySettings, ...profileSettings };
    const texts = Object.fromEntries(Object.entries(TEXT_DEFAULTS).map(([key, value]) => [key, settings[`text_${key}`] ?? value]));
    return Response.json({ profileId, heroVideoUrl: settings[VIDEO_URL_KEY] ?? '', testimonialsEnabled: settings[TESTIMONIALS_ENABLED_KEY] !== 'false', projectName: settings[PROJECT_NAME_KEY] || profile?.name || '', texts });
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
    const body = await request.json() as { heroVideoUrl?: string; testimonialsEnabled?: boolean; projectName?: string; texts?: Record<string, string> };
    const updates: Promise<unknown>[] = [];
    if (typeof body.testimonialsEnabled === 'boolean') {
      updates.push(saveProfileSetting(profileId, TESTIMONIALS_ENABLED_KEY, String(body.testimonialsEnabled)));
    }
    if (typeof body.projectName === 'string') {
      const name = body.projectName.trim();
      updates.push(saveProfileSetting(profileId, PROJECT_NAME_KEY, name));
      if (name) updates.push(getDatabase().prepare('UPDATE project_profiles SET name = ? WHERE id = ?').bind(name, profileId).run());
    }
    if (body.texts && typeof body.texts === 'object') {
      for (const key of TEXT_KEYS) {
        if (typeof body.texts[key] === 'string') updates.push(saveProfileSetting(profileId, `text_${key}`, body.texts[key].trim()));
      }
    }
    if (!('heroVideoUrl' in body)) {
      try {
        await Promise.all(updates);
        return Response.json({ testimonialsEnabled: body.testimonialsEnabled, projectName: typeof body.projectName === 'string' ? body.projectName.trim() : undefined, texts: body.texts });
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
