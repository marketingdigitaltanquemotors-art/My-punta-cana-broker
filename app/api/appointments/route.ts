import { getDatabase } from '@/db';

const lots = new Set(['A-12', 'B-07', 'C-21']);
const times = Array.from({ length: 18 }, (_, index) => { const minutes = 510 + index * 30; return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; });

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get('date') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ error: 'Selecciona una fecha válida.' }, { status: 400 });
  try {
    const result = await getDatabase().prepare('SELECT appointment_time FROM appointments WHERE appointment_date = ?').bind(date).all<{ appointment_time: string }>();
    return Response.json({ bookedTimes: result.results.map(row => row.appointment_time) });
  } catch (error) { console.error('availability_error', error); return Response.json({ error: 'No pudimos consultar los horarios. Intenta de nuevo.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  const body = await request.json() as Record<string, string>;
  const lotId = body.lotId?.trim(); const date = body.date?.trim(); const time = body.time?.trim();
  const name = body.name?.trim(); const phone = body.phone?.trim(); const email = body.email?.trim() || null;
  if (!lots.has(lotId) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !times.includes(time) || !name || !phone) return Response.json({ error: 'Completa correctamente todos los datos requeridos.' }, { status: 400 });
  const code = `MPCB-${date.replaceAll('-', '')}-${time.replace(':', '')}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  try {
    await getDatabase().prepare('INSERT INTO appointments (lot_id, appointment_date, appointment_time, client_name, phone, email, reservation_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(lotId, date, time, name, phone, email, code, Math.floor(Date.now() / 1000)).run();
    return Response.json({ appointment: { lotId, date, time, name, code } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE') || message.includes('constraint')) return Response.json({ error: 'Ese horario acaba de ser reservado. Elige otro turno.' }, { status: 409 });
    console.error('booking_error', error); return Response.json({ error: 'No pudimos confirmar la visita. Intenta de nuevo.' }, { status: 503 });
  }
}
