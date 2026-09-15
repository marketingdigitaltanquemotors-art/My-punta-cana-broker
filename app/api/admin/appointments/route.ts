import { getDatabase } from '@/db';
import { requireAdmin } from '@/lib/admin-auth';
const ACTIVE_PROFILE_KEY = 'active_project_profile_id';

async function activeProfileId() {
  const row = await getDatabase().prepare('SELECT value FROM site_settings WHERE key = ?').bind(ACTIVE_PROFILE_KEY).first<{ value: string }>();
  return Number(row?.value) || 1;
}

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  try {
    const result = await getDatabase().prepare('SELECT id, appointment_date, appointment_time, client_name, phone, email, reservation_code, created_at FROM appointments WHERE profile_id = ? ORDER BY appointment_date DESC, appointment_time DESC').bind(await activeProfileId()).all();
    return Response.json({ appointments: result.results ?? [] });
  } catch (error) {
    console.error('admin_appointments_error', error);
    return Response.json({ error: 'No pudimos cargar las citas.' }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: 'Cita inválida.' }, { status: 400 });
  try {
    const result = await getDatabase().prepare('DELETE FROM appointments WHERE id = ?').bind(id).run();
    if (!result.meta?.changes) return Response.json({ error: 'Esa cita no existe.' }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error('admin_appointments_delete_error', error);
    return Response.json({ error: 'No pudimos eliminar la cita.' }, { status: 503 });
  }
}
