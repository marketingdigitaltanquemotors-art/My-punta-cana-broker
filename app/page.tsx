'use client';
import { useState } from 'react';
import { ArrowRight, CalendarDays, ChevronDown, Mail, MapPin, Menu, MessageCircle, Phone, Ruler, ShieldCheck, Trees, X } from 'lucide-react';

const lots = [
  { id: 'A-12', area: 300, price: 1950000, status: 'Disponible', tag: 'Esquina' },
  { id: 'B-07', area: 250, price: 1650000, status: 'Disponible', tag: 'Vista verde' },
  { id: 'C-21', area: 400, price: 2520000, status: 'Última unidad', tag: 'Premium' },
];
const money = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 });
function Brand() { return <span className="brand"><span className="logo-mark">M</span><span><b>MY PUNTA CANA</b><small>BROKER</small></span></span>; }

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <main>
    <header className="site-header"><a href="#inicio" aria-label="My Punta Cana Broker, inicio"><Brand /></a><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">{menuOpen ? <X /> : <Menu />}</button><nav className={menuOpen ? 'open' : ''}><a href="#inicio">Inicio</a><a href="#solares">Solares</a><a href="/agendar-visita">Agendar Visita</a><a href="#contacto">Contacto</a></nav><a className="header-cta" href="/agendar-visita">AGENDAR VISITA <ArrowRight /></a></header>
    <section id="inicio" className="hero"><div className="hero-copy"><span className="eyebrow"><MapPin /> PUNTA CANA · BÁVARO</span><h1>Encuentra el solar ideal para <em>construir tu futuro</em></h1><p>Conoce nuestros solares disponibles en Punta Cana-Bávaro y agenda una visita de manera rápida y sencilla.</p><div className="hero-actions"><a className="btn primary" href="#solares">VER SOLARES <ArrowRight /></a><a className="btn outline" href="/agendar-visita">AGENDAR VISITA <CalendarDays /></a></div><div className="trust"><span><ShieldCheck /> Proceso transparente</span><span><Trees /> Ubicaciones con potencial</span><span><CalendarDays /> Visitas personalizadas</span></div></div><aside className="hero-card"><span>SOLAR <b>#A-12</b></span><div className="parcel"><b>300 m²</b><small>Vía principal</small></div><div><span>Desde <b>{money.format(1950000)}</b></span><a href="#solares">Ver detalles <ArrowRight /></a></div></aside><a href="#solares" className="scroll">EXPLORAR <ChevronDown /></a></section>
    <section id="solares" className="section"><div className="heading"><div><span className="kicker">OPORTUNIDADES DISPONIBLES</span><h2>Un terreno para cada proyecto de vida.</h2></div><p>Selección de solares con acceso, documentación clara y acompañamiento personalizado de principio a fin.</p></div><div className="lot-grid">{lots.map((lot,i) => <article className="lot-card" key={lot.id}><div className={`lot-image image-${i+1}`}><span>{lot.tag}</span><b>#{lot.id}</b></div><div className="lot-body"><span className="status"><i /> {lot.status}</span><h3>Solar {lot.id}</h3><div className="lot-stats"><span><Ruler /> {lot.area} m²</span><b>{money.format(lot.price)}</b></div><a className="lot-action" href={`/agendar-visita?solar=${encodeURIComponent(lot.id)}`}>AGENDAR VISITA <ArrowRight /></a></div></article>)}</div></section>
    <section className="visit-banner"><div><span className="kicker">CONOCE EL LUGAR</span><h2>Tu próximo proyecto comienza con una visita.</h2></div><a className="btn primary" href="/agendar-visita">VER FECHAS DISPONIBLES <ArrowRight /></a></section>
    <footer id="contacto"><div className="footer-grid"><div><Brand /><p>Solares y terrenos en Punta Cana-Bávaro</p></div><div><b>CONTÁCTANOS</b><a href="#"><MessageCircle/> WhatsApp</a><a href="tel:+18090000000"><Phone/> Teléfono</a><a href="mailto:info@mypuntacanabroker.com"><Mail/> Correo electrónico</a></div><div><b>SÍGUENOS</b><a href="#">◎&nbsp;&nbsp; Instagram</a><a href="#">f&nbsp;&nbsp; Facebook</a><a href="#"><MapPin/> Ubicación</a></div></div><div className="copyright"><span>© 2026 My Punta Cana Broker</span><span>Invierte en tierra. Construye tu futuro.</span></div></footer>
  </main>;
}
