import { getDatabase } from '@/db';

const ACTIVE_PROFILE_KEY = 'active_project_profile_id';

async function activeProfileId() {
  const row = await getDatabase().prepare('SELECT value FROM site_settings WHERE key = ?').bind(ACTIVE_PROFILE_KEY).first<{ value: string }>();
  return Number(row?.value) || 1;
}

async function setActiveProfile(id: number) {
  await getDatabase().prepare('INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at').bind(ACTIVE_PROFILE_KEY, String(id), Math.floor(Date.now() / 1000)).run();
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

export async function GET() {
  try {
    await ensureDefaultProfile();
    const result = await getDatabase().prepare('SELECT id, name, created_at FROM project_profiles ORDER BY id ASC').all<{ id: number; name: string; created_at: number }>();
    const profiles = result.results ?? [];
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
    return Response.json({ profile, activeProfileId: profile.id }, { status: 201 });
  } catch (error) {
    console.error('project_profiles_create_error', error);
    return Response.json({ error: 'No pudimos crear el perfil.' }, { status: 503 });
  }
}

export async function PUT(request: Request) {
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
    return Response.json({ activeProfileId: id });
  } catch (error) {
    console.error('project_profiles_update_error', error);
    return Response.json({ error: 'No pudimos activar el perfil.' }, { status: 503 });
  }
}
