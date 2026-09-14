import { getDatabase } from '@/db';

const times = Array.from({ length: 18 }, (_, index) => { const minutes = 510 + index * 30; return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; });

function currentPuntaCanaDateTime() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return { date: `${value.year}-${value.month}-${value.day}`, time: `${value.hour}:${value.minute}` };
}

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
  const date = body.date?.trim(); const time = body.time?.trim();
  const name = body.name?.trim(); const phone = body.phone?.trim(); const email = body.email?.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !times.includes(time) || !name || !phone || !email) return Response.json({ error: 'Completa correctamente todos los datos requeridos.' }, { status: 400 });
  const current = currentPuntaCanaDateTime();
  if (date < current.date || (date === current.date && time < current.time)) return Response.json({ error: 'Ese horario ya pasó. Elige una hora disponible.' }, { status: 400 });
  const code = `MPCB-${date.replaceAll('-', '')}-${time.replace(':', '')}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  try {
    await getDatabase().prepare('INSERT INTO appointments (lot_id, appointment_date, appointment_time, client_name, phone, email, reservation_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind('VISITA', date, time, name, phone, email, code, Math.floor(Date.now() / 1000)).run();
    return Response.json({ appointment: { date, time, name, code } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE') || message.includes('constraint')) return Response.json({ error: 'Ese horario acaba de ser reservado. Elige otro turno.' }, { status: 409 });
    console.error('booking_error', error); return Response.json({ error: 'No pudimos confirmar la visita. Intenta de nuevo.' }, { status: 503 });
  }
}
