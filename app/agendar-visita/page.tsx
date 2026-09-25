'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, CalendarDays, Check, Clock3, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const makeSlots = (start: number, count: number) => Array.from({ length: count }, (_, index) => { const minutes = start + index * 30; return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; });
const weekdaySlots = makeSlots(510, 18);
const saturdaySlots = makeSlots(540, 7);
const showTime = (time: string) => new Date(`2000-01-01T${time}:00`).toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit', hour12: true });
const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');
const puntaCanaNow = (date: Date) => { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date); const value = Object.fromEntries(parts.map(part => [part.type, part.value])); return { date: `${value.year}-${value.month}-${value.day}`, time: `${value.hour}:${value.minute}` }; };

type Confirmation = { date: string; time: string; name: string; code: string };
type AppointmentResponse = { error?: string; bookedTimes?: string[]; appointment?: Confirmation };

export default function ScheduleVisit() {
  const today = useMemo(() => { const value = new Date(); value.setHours(0,0,0,0); return value; }, []);
  const [date, setDate] = useState<Date>(today);
  const [time, setTime] = useState('');
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [details, setDetails] = useState({ name: '', phone: '', email: '' });
  const [profileId, setProfileId] = useState('');
  const slots = date.getDay() === 6 ? saturdaySlots : weekdaySlots;
  const profileQuery = profileId ? `&profileId=${encodeURIComponent(profileId)}` : '';
  const profileScheduleQuery = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
  const backHref = profileId ? `/proyecto/${encodeURIComponent(profileId)}` : '/';

  useEffect(() => { setProfileId(new URLSearchParams(window.location.search).get('profileId') ?? ''); }, []);
  useEffect(() => { setNow(new Date()); const timer = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setTime(''); setError('');
    fetch(`/api/appointments?date=${dateKey(date)}${profileQuery}`, { signal: controller.signal }).then(async response => { const data = await response.json() as AppointmentResponse; if (!response.ok) throw new Error(data.error); setBookedTimes(data.bookedTimes ?? []); }).catch(err => { if (err.name !== 'AbortError') setError(err.message || 'No pudimos consultar los horarios.'); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [date, profileQuery]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!time) { setError('Selecciona un horario disponible.'); return; }
    setSubmitting(true); setError('');
    const response = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: dateKey(date), time, profileId, ...details }) });
    const data = await response.json() as AppointmentResponse;
    if (!response.ok) { setError(data.error ?? 'No pudimos confirmar la cita.'); if (response.status === 409) setBookedTimes(current => [...new Set([...current, time])]); setTime(''); setSubmitting(false); return; }
    setConfirmation(data.appointment ?? null); setSubmitting(false);
  }

  return <main className="schedule-page">
    <header className="schedule-header"><a href={backHref} className="brand"><span className="logo-mark">M</span><span><b>MY PUNTA CANA</b><small>BROKER</small></span></a><a href={backHref} className="back-link"><ArrowLeft/> VOLVER AL INICIO</a></header>
    <section className="schedule-hero"><span className="eyebrow"><CalendarDays/> AGENDA TU RECORRIDO</span><h1>Elige el día y la hora de tu visita.</h1><p>Los horarios ocupados se bloquean automáticamente para que tu reserva sea exclusiva.</p></section>
    <section className="schedule-content">
      {confirmation ? <div className="schedule-confirmation"><span className="check"><Check/></span><span className="kicker">RESERVA CONFIRMADA</span><h2>¡Tu visita con My Punta Cana Broker ha sido agendada!</h2><p>Te esperamos en la fecha acordada.</p><div className="confirmation-details"><span><CalendarDays/><small>Fecha</small><b>{format(new Date(`${confirmation.date}T12:00:00`), "d 'de' MMMM", { locale: es })}</b></span><span><Clock3/><small>Hora</small><b>{showTime(confirmation.time)}</b></span></div><p className="reservation-code">Código de reserva <b>{confirmation.code}</b></p><button className="new-booking" onClick={() => { setConfirmation(null); setDetails({name:'',phone:'',email:''}); setTime(''); }}>AGENDAR OTRA VISITA</button></div> : <form className="scheduler" action={`/agendar-visita${profileScheduleQuery}`} onSubmit={submit}>
        <div className="schedule-step"><span className="step-number">01</span><div><span className="kicker">FECHA DISPONIBLE</span><h2>Selecciona un día</h2></div><Calendar mode="single" selected={date} onSelect={value => value && setDate(value)} disabled={[{ before: today, after: addDays(today, 60) }, { dayOfWeek: [0] }]} locale={es} className="booking-calendar" /></div>
        <div className="schedule-step"><span className="step-number">02</span><div><span className="kicker">HORARIO DE VISITA</span><h2>{format(date, "EEEE, d 'de' MMMM", { locale: es })}</h2><p>{date.getDay() === 6 ? 'Sábados de 9:00 a. m. a 12:00 p. m.' : 'Lunes a viernes de 8:30 a. m. a 5:00 p. m.'}</p></div>{loading ? <div className="slots-loading"><LoaderCircle/> Consultando horarios…</div> : <div className="time-slots">{slots.map(slot => { const current = now ? puntaCanaNow(now) : null; const isPast = Boolean(current && dateKey(date) === current.date && slot < current.time); const unavailable = bookedTimes.includes(slot) || isPast; return <button type="button" key={slot} disabled={unavailable} className={time === slot ? 'selected' : ''} onClick={() => { setTime(slot); setError(''); }}>{showTime(slot)}{unavailable && <small>{isPast ? 'Pasó' : 'Ocupado'}</small>}</button>; })}</div>}</div>
        <div className="schedule-step details-step"><span className="step-number">03</span><div><span className="kicker">DATOS DE CONTACTO</span><h2>Completa tu reserva</h2></div><div className="schedule-fields"><label>Nombre completo<Input required value={details.name} onChange={e => setDetails({...details,name:e.target.value})} placeholder="Tu nombre" /></label><label>WhatsApp<Input required type="tel" value={details.phone} onChange={e => setDetails({...details,phone:e.target.value})} placeholder="(809) 000-0000" /></label><label>Correo electrónico<Input required type="email" value={details.email} onChange={e => setDetails({...details,email:e.target.value})} placeholder="tu@correo.com" /></label></div>{error && <p className="schedule-error" role="alert">{error}</p>}<Button type="submit" disabled={submitting || !time} className="confirm-booking">{submitting ? <><LoaderCircle/> CONFIRMANDO…</> : <>CONFIRMAR VISITA <Check/></>}</Button><p className="privacy"><ShieldCheck/> Al confirmar, este horario quedará bloqueado para otros clientes.</p></div>
      </form>}
    </section>
  </main>;
}
