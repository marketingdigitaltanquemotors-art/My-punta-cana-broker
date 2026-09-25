import { getDatabase } from '@/db';
import { getMediaBucket } from '@/db';
import { requireAdmin } from '@/lib/admin-auth';
import { invalidateMemoryCache, SHORT_CACHE_TTL, withMemoryCache } from '@/lib/memory-cache';

const ACTIVE_PROFILE_KEY = 'active_project_profile_id';

async function activeProfileId() {
  return withMemoryCache('config:active-profile', SHORT_CACHE_TTL, async () => {
    const row = await getDatabase().prepare('SELECT value FROM site_settings WHERE key = ?').bind(ACTIVE_PROFILE_KEY).first<{ value: string }>();
    return Number(row?.value) || 1;
  });
}

async function setActiveProfile(id: number) {
  await getDatabase().prepare('INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at').bind(ACTIVE_PROFILE_KEY, String(id), Math.floor(Date.now() / 1000)).run();
  invalidateMemoryCache('config:active-profile', 'projects:');
}

async function ensureDefaultProfile() {
  const existing = await getDatabase().prepare('SELECT id, name, created_at FROM project_profiles ORDER BY id ASC LIMIT 1').first<{ id: number; name: string; created_at: number }>();
  if (existing) return existing;
  const now = Math.floor(Date.now() / 1000);
  const profile = await getDatabase().prepare('INSERT INTO project_profiles (id, name, created_at) VALUES (?, ?, ?) RETURNING id, name, created_at').bind(1, 'Perfil principal', now).first<{ id: number; name: string; created_at: number }>();
  await getDatabase().prepare('INSERT INTO project_profile_settings (profile_id, key, value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(profile_id, key) DO NOTHING').bind(1, 'testimonials_enabled', 'true', now).run();
  await setActiveProfile(profile?.id ?? 1);
  return profile ?? { id: 1, name: 'Perfil principal', created_at: now };
}

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  try {
    await ensureDefaultProfile();
    const profiles = await withMemoryCache('projects:list', SHORT_CACHE_TTL, async () => {
      const result = await getDatabase().prepare('SELECT id, name, created_at FROM project_profiles ORDER BY id ASC').all<{ id: number; name: string; created_at: number }>();
      return result.results ?? [];
    });
    let activeId = await activeProfileId();
    if (!profiles.some(profile => profile.id === activeId)) {
      activeId = profiles[0]?.id ?? 1;
      await setActiveProfile(activeId);
    }
    return Response.json({ profiles, activeProfileId: activeId });
  } catch (error) {
    console.error('project_profiles_list_error', error);
    return Response.json({ error: 'No pudimos cargar los perfiles.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const body = await request.json() as { name?: string };
  const name = body.name?.trim();
  if (!name) return Response.json({ error: 'Escribe el nombre del proyecto o lotificación.' }, { status: 400 });
  try {
    const profile = await getDatabase().prepare('INSERT INTO project_profiles (name, created_at) VALUES (?, ?) RETURNING id, name, created_at').bind(name, Math.floor(Date.now() / 1000)).first<{ id: number; name: string; created_at: number }>();
    if (!profile) throw new Error('profile_not_created');
    await getDatabase().batch([
      getDatabase().prepare('INSERT INTO project_profile_settings (profile_id, key, value, updated_at) VALUES (?, ?, ?, ?)').bind(profile.id, 'project_name', name, Math.floor(Date.now() / 1000)),
      getDatabase().prepare('INSERT INTO project_profile_settings (profile_id, key, value, updated_at) VALUES (?, ?, ?, ?)').bind(profile.id, 'testimonials_enabled', 'true', Math.floor(Date.now() / 1000)),
    ]);
    await setActiveProfile(profile.id);
    invalidateMemoryCache('projects:', 'config:', 'media:');
    return Response.json({ profile, activeProfileId: profile.id }, { status: 201 });
  } catch (error) {
    console.error('project_profiles_create_error', error);
    return Response.json({ error: 'No pudimos crear el perfil.' }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const body = await request.json() as { activeProfileId?: number; name?: string };
  const id = Number(body.activeProfileId);
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: 'Selecciona un perfil válido.' }, { status: 400 });
  try {
    const existing = await getDatabase().prepare('SELECT id FROM project_profiles WHERE id = ?').bind(id).first<{ id: number }>();
    if (!existing) return Response.json({ error: 'Ese perfil no existe.' }, { status: 404 });
    const statements = [getDatabase().prepare('INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at').bind(ACTIVE_PROFILE_KEY, String(id), Math.floor(Date.now() / 1000))];
    if (typeof body.name === 'string' && body.name.trim()) {
      statements.push(getDatabase().prepare('UPDATE project_profiles SET name = ? WHERE id = ?').bind(body.name.trim(), id));
    }
    await getDatabase().batch(statements);
    invalidateMemoryCache('projects:', 'config:', 'media:');
    return Response.json({ activeProfileId: id });
  } catch (error) {
    console.error('project_profiles_update_error', error);
    return Response.json({ error: 'No pudimos activar el perfil.' }, { status: 503 });
  }
}

function keyFromMediaUrl(value?: string | null) {
  if (!value?.startsWith('/api/content/image?key=')) return '';
  return new URLSearchParams(value.split('?')[1] ?? '').get('key') ?? '';
}

export async function DELETE(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: 'Selecciona un perfil válido.' }, { status: 400 });
  try {
    await ensureDefaultProfile();
    const profiles = await getDatabase().prepare('SELECT id FROM project_profiles ORDER BY id ASC').all<{ id: number }>();
    const profileIds = profiles.results ?? [];
    if (!profileIds.some(profile => profile.id === id)) return Response.json({ error: 'Ese perfil no existe.' }, { status: 404 });
    if (profileIds.length <= 1) return Response.json({ error: 'Debes dejar al menos un perfil.' }, { status: 400 });

    const content = await getDatabase().prepare('SELECT COALESCE(media_key, image_key) AS media_key FROM content_items WHERE profile_id = ?').bind(id).all<{ media_key: string }>();
    const settings = await getDatabase().prepare('SELECT value FROM project_profile_settings WHERE profile_id = ? AND key = ?').bind(id, 'hero_video_url').all<{ value: string }>();
    const mediaKeys = [
      ...(content.results ?? []).map(item => item.media_key),
      ...(settings.results ?? []).map(item => keyFromMediaUrl(item.value)).filter(Boolean)
    ];

    await getDatabase().batch([
      getDatabase().prepare('DELETE FROM appointments WHERE profile_id = ?').bind(id),
      getDatabase().prepare('DELETE FROM content_items WHERE profile_id = ?').bind(id),
      getDatabase().prepare('DELETE FROM media_items WHERE profile_id = ?').bind(id),
      getDatabase().prepare('DELETE FROM project_profile_settings WHERE profile_id = ?').bind(id),
      getDatabase().prepare('DELETE FROM project_profiles WHERE id = ?').bind(id)
    ]);
    await Promise.all(mediaKeys.map(key => getMediaBucket().delete(key).catch(() => {})));
    invalidateMemoryCache('projects:', 'config:', 'media:', 'media-url:');

    let activeId = await activeProfileId();
    if (activeId === id) {
      const replacement = await getDatabase().prepare('SELECT id FROM project_profiles ORDER BY id ASC LIMIT 1').first<{ id: number }>();
      activeId = replacement?.id ?? 1;
      await setActiveProfile(activeId);
    }
    return Response.json({ ok: true, activeProfileId: activeId });
  } catch (error) {
    console.error('project_profiles_delete_error', error);
    return Response.json({ error: 'No pudimos eliminar el perfil.' }, { status: 503 });
  }
}
