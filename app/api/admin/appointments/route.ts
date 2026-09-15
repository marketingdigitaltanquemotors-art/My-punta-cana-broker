import { getDatabase } from '@/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  try {
    const result = await getDatabase().prepare(`
      SELECT
        appointments.id,
        appointments.profile_id,
        COALESCE(project_profiles.name, 'Perfil no disponible') AS profile_name,
        appointments.appointment_date,
        appointments.appointment_time,
        appointments.client_name,
        appointments.phone,
        appointments.email,
        appointments.reservation_code,
        appointments.created_at
      FROM appointments
      LEFT JOIN project_profiles ON project_profiles.id = appointments.profile_id
      ORDER BY appointments.appointment_date DESC, appointments.appointment_time DESC
    `).all();
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
