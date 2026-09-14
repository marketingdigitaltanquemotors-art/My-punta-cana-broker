import { getDatabase } from '@/db';

export async function GET() {
  try {
    const result = await getDatabase().prepare('SELECT id, appointment_date, appointment_time, client_name, phone, email, reservation_code, created_at FROM appointments ORDER BY appointment_date DESC, appointment_time DESC').all();
    return Response.json({ appointments: result.results ?? [] });
  } catch (error) {
    console.error('admin_appointments_error', error);
    return Response.json({ error: 'No pudimos cargar las citas.' }, { status: 503 });
  }
}
