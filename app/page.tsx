'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronDown, Clock3, Mail, MapPin, Menu, MessageCircle, Phone, Ruler, ShieldCheck, Trees, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const lots = [
  { id: 'A-12', area: 300, price: 1950000, status: 'Disponible', tag: 'Esquina' },
  { id: 'B-07', area: 250, price: 1650000, status: 'Disponible', tag: 'Vista verde' },
  { id: 'C-21', area: 400, price: 2520000, status: 'Última unidad', tag: 'Premium' },
];
const money = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 });

function Brand() { return <span className="brand"><span className="logo-mark">M</span><span><b>MY PUNTA CANA</b><small>BROKER</small></span></span>; }

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState(lots[0]);
  const [initial, setInitial] = useState(20);
  const [months, setMonths] = useState(36);
  const [booked, setBooked] = useState(false);
  const [booking, setBooking] = useState({ name: '', phone: '', date: '', time: '' });
  const payment = useMemo(() => { const deposit = selected.price * initial / 100; return { deposit, monthly: (selected.price - deposit) / months }; }, [selected, initial, months]);
  const code = `MPCB-${selected.id.replace('-', '')}-2609`;
  const whatsapp = encodeURIComponent(`Hola, My Punta Cana Broker. Acabo de agendar una visita para conocer el Solar #${selected.id} el día ${booking.date || '___'} a las ${booking.time || '___'}. Mi código de reserva es ${code}.`);
  function reserve(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setBooked(true); setTimeout(() => document.querySelector('#confirmacion')?.scrollIntoView({ behavior: 'smooth' }), 80); }

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: object, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'create_property_visit', title: 'Agendar visita a un solar',
      description: 'Confirma una visita a un solar disponible y muestra la reserva en la página.',
      inputSchema: { type: 'object', properties: { lotId: { type: 'string', enum: lots.map(l => l.id) }, name: { type: 'string' }, phone: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } }, required: ['lotId','name','phone','date','time'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const value = input as Record<string,string>; const lot = lots.find(l => l.id === value.lotId);
        if (!lot || !value.name || !value.phone || !/^\d{4}-\d{2}-\d{2}$/.test(value.date || '') || !value.time) throw new Error('Datos de visita inválidos.');
        setSelected(lot); setBooking({ name:value.name, phone:value.phone, date:value.date, time:value.time }); setBooked(true);
        setTimeout(() => document.querySelector('#confirmacion')?.scrollIntoView({ behavior:'smooth' }), 80);
        return { status:'confirmed', lotId:lot.id, date:value.date, time:value.time, reservationCode:`MPCB-${lot.id.replace('-','')}-2609` };
      }
    }, { signal:lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return <main>
    <header className="site-header"><a href="#inicio" aria-label="My Punta Cana Broker, inicio"><Brand /></a><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">{menuOpen ? <X /> : <Menu />}</button><nav className={menuOpen ? 'open' : ''}>{['Inicio','Solares','Simular Pago','Agendar Visita','Contacto'].map(x => <a key={x} href={`#${x.toLowerCase().replaceAll(' ','-')}`} onClick={() => setMenuOpen(false)}>{x}</a>)}</nav><a className="header-cta" href="#agendar-visita">AGENDAR VISITA <ArrowRight /></a></header>

    <section id="inicio" className="hero"><div className="hero-copy"><span className="eyebrow"><MapPin /> PUNTA CANA · BÁVARO</span><h1>Encuentra el solar ideal para <em>construir tu futuro</em></h1><p>Conoce nuestros solares disponibles en Punta Cana-Bávaro, simula tu plan de pago y agenda una visita de manera rápida y sencilla.</p><div className="hero-actions"><a className="btn primary" href="#solares">VER SOLARES <ArrowRight /></a><a className="btn outline" href="#simular-pago">SIMULAR MI PAGO</a><a className="btn plain" href="#agendar-visita">AGENDAR VISITA</a></div><div className="trust"><span><ShieldCheck /> Proceso transparente</span><span><Trees /> Ubicaciones con potencial</span><span><CalendarDays /> Visitas personalizadas</span></div></div><aside className="hero-card"><span>SOLAR <b>#A-12</b></span><div className="parcel"><b>300 m²</b><small>Vía principal</small></div><div><span>Desde <b>{money.format(1950000)}</b></span><a href="#solares">Ver detalles <ArrowRight /></a></div></aside><a href="#solares" className="scroll">EXPLORAR <ChevronDown /></a></section>

    <section id="solares" className="section"><div className="heading"><div><span className="kicker">OPORTUNIDADES DISPONIBLES</span><h2>Un terreno para cada proyecto de vida.</h2></div><p>Selección de solares con acceso, documentación clara y acompañamiento personalizado de principio a fin.</p></div><div className="lot-grid">{lots.map((lot,i) => <article className={selected.id === lot.id ? 'lot-card selected' : 'lot-card'} key={lot.id}><div className={`lot-image image-${i+1}`}><span>{lot.tag}</span><b>#{lot.id}</b></div><div className="lot-body"><span className="status"><i /> {lot.status}</span><h3>Solar {lot.id}</h3><div className="lot-stats"><span><Ruler /> {lot.area} m²</span><b>{money.format(lot.price)}</b></div><button onClick={() => { setSelected(lot); document.querySelector('#simular-pago')?.scrollIntoView({behavior:'smooth'}); }}>SIMULAR ESTE SOLAR <ArrowRight /></button></div></article>)}</div></section>

    <section id="simular-pago" className="calculator-wrap"><div className="calc-intro"><span className="kicker">SIMULADOR DE PAGOS</span><h2>Haz números.<br/>Imagina lo que sigue.</h2><p>Configura un plan estimado en segundos. Nuestro equipo puede ayudarte a personalizarlo.</p><div className="calc-note"><ShieldCheck /><span><b>Simulación sin compromiso</b><small>Valores de referencia sujetos a confirmación.</small></span></div></div><div className="calculator"><div className="calc-top"><label>Solar seleccionado<select value={selected.id} onChange={e => setSelected(lots.find(l => l.id === e.target.value) || lots[0])}>{lots.map(l => <option value={l.id} key={l.id}>Solar #{l.id} · {l.area} m²</option>)}</select></label><span>Precio del solar<b>{money.format(selected.price)}</b></span></div><label className="range"><span>Inicial <b>{initial}%</b></span><input type="range" min="10" max="50" step="5" value={initial} onChange={e => setInitial(+e.target.value)} /></label><label className="range"><span>Plazo <b>{months} meses</b></span><input type="range" min="12" max="60" step="12" value={months} onChange={e => setMonths(+e.target.value)} /></label><div className="result"><span>Tu cuota mensual estimada<small>Luego de una inicial de {money.format(payment.deposit)}</small></span><b>{money.format(payment.monthly)}<small>/ mes</small></b></div><a className="btn primary dark" href="#agendar-visita">QUIERO CONOCER ESTE SOLAR <ArrowRight /></a></div></section>

    <section id="agendar-visita" className="section booking-section"><div className="heading"><div><span className="kicker">AGENDA TU RECORRIDO</span><h2>El próximo paso es verlo en persona.</h2></div><p>Selecciona una fecha y nuestro equipo coordinará contigo todos los detalles de la visita.</p></div><div className="booking"><aside><span className="step">01</span><h3>Visita a Solar #{selected.id}</h3><p>Un asesor de My Punta Cana Broker te acompañará durante el recorrido.</p><ul><li><Check /> Ubicación y accesos</li><li><Check /> Linderos y dimensiones</li><li><Check /> Opciones de financiamiento</li></ul><div><span>{selected.area} m²</span><b>{money.format(selected.price)}</b></div></aside>{!booked ? <form onSubmit={reserve}><h3>Completa tus datos</h3><div className="fields"><label>Nombre completo<Input required placeholder="Tu nombre" value={booking.name} onChange={e => setBooking({...booking,name:e.target.value})}/></label><label>WhatsApp<Input required type="tel" placeholder="(809) 000-0000" value={booking.phone} onChange={e => setBooking({...booking,phone:e.target.value})}/></label><label>Fecha<Input required type="date" value={booking.date} onChange={e => setBooking({...booking,date:e.target.value})}/></label><label>Hora<select required value={booking.time} onChange={e => setBooking({...booking,time:e.target.value})}><option value="">Seleccionar</option><option>9:00 AM</option><option>11:00 AM</option><option>3:00 PM</option><option>5:00 PM</option></select></label></div><Button type="submit">CONFIRMAR MI VISITA <ArrowRight /></Button><small className="privacy"><ShieldCheck /> Tus datos se utilizarán únicamente para coordinar tu visita.</small></form> : <div className="confirmation" id="confirmacion"><span className="check"><Check /></span><span className="kicker">RESERVA CONFIRMADA</span><h3>¡Tu visita con My Punta Cana Broker ha sido agendada!</h3><div className="appointment"><span><MapPin/><small>Solar</small><b>#{selected.id}</b></span><span><CalendarDays/><small>Fecha</small><b>{booking.date}</b></span><span><Clock3/><small>Hora</small><b>{booking.time}</b></span></div><p>Código de reserva <b>{code}</b></p><a className="btn whatsapp" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${whatsapp}`}><MessageCircle/> ENVIAR POR WHATSAPP</a></div>}</div></section>

    <footer id="contacto"><div className="footer-grid"><div><Brand /><p>Solares y terrenos en Punta Cana-Bávaro</p></div><div><b>CONTÁCTANOS</b><a href="#"><MessageCircle/> WhatsApp</a><a href="tel:+18090000000"><Phone/> Teléfono</a><a href="mailto:info@mypuntacanabroker.com"><Mail/> Correo electrónico</a></div><div><b>SÍGUENOS</b><a href="#">◎&nbsp;&nbsp; Instagram</a><a href="#">f&nbsp;&nbsp; Facebook</a><a href="#"><MapPin/> Ubicación</a></div></div><div className="copyright"><span>© 2026 My Punta Cana Broker</span><span>Invierte en tierra. Construye tu futuro.</span></div></footer>
  </main>;
}
