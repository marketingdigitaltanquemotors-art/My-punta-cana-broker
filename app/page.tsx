'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, ImageIcon, Mail, MapPin, Menu, MessageCircle, Phone, Settings, ShieldCheck, Star, Trees, X } from 'lucide-react';
function Brand() { return <span className="brand"><span className="logo-mark">M</span><span><b>MY PUNTA CANA</b><small>BROKER</small></span></span>; }
type ContentItem = { id: number; type: 'solar' | 'testimonial'; title: string; description?: string; image_url: string };

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [solares, setSolares] = useState<ContentItem[]>([]);
  const [testimonios, setTestimonios] = useState<ContentItem[]>([]);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/site-settings', { cache: 'no-store' }).then(async response => {
      if (response.ok) {
        const data = await response.json();
        setHeroVideoUrl(data.heroVideoUrl ?? '');
      }
    }).catch(() => {});
    fetch('/api/content', { cache: 'no-store' }).then(async response => {
      if (response.ok) {
        const data = await response.json() as { items?: ContentItem[] };
        const items = data.items ?? [];
        setSolares(items.filter(item => item.type === 'solar'));
        setTestimonios(items.filter(item => item.type === 'testimonial'));
      }
    }).catch(() => {});
  }, []);
  useEffect(() => { if (testimonialIndex >= testimonios.length) setTestimonialIndex(0); }, [testimonialIndex, testimonios.length]);
  const activeTestimonial = testimonios[testimonialIndex];
  const previousTestimonial = () => setTestimonialIndex(index => testimonios.length ? (index - 1 + testimonios.length) % testimonios.length : 0);
  const nextTestimonial = () => setTestimonialIndex(index => testimonios.length ? (index + 1) % testimonios.length : 0);
  const finishSwipe = (x: number) => {
    if (touchStart === null) return;
    const distance = touchStart - x;
    if (Math.abs(distance) > 45) distance > 0 ? nextTestimonial() : previousTestimonial();
    setTouchStart(null);
  };
  return <main>
    <header className="site-header"><a href="#inicio" aria-label="My Punta Cana Broker, inicio"><Brand /></a><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">{menuOpen ? <X /> : <Menu />}</button><nav className={menuOpen ? 'open' : ''}><a href="#inicio">Inicio</a><a href="/agendar-visita">Agendar Visita</a><a href="#contacto">Contacto</a></nav><a className="header-cta" href="/agendar-visita">AGENDAR VISITA <ArrowRight /></a></header>
    <section id="inicio" className="hero hero-simple"><div className="hero-media" aria-hidden="true">{heroVideoUrl ? <video src={heroVideoUrl} poster="/hero-solar-v1.png" autoPlay muted loop playsInline onError={() => setHeroVideoUrl('')} /> : <img src="/hero-solar-v1.png" alt="" />}</div><div className="hero-shade" aria-hidden="true"/><div className="hero-copy"><span className="eyebrow"><MapPin /> PUNTA CANA · BÁVARO</span><h1>Encuentra tu solar en el centro de <em>Punta Cana-Bávaro, cerca de todo.</em></h1><p>Agenda una visita personalizada en Punta Cana-Bávaro de manera rápida y sencilla.</p><div className="hero-actions"><a className="btn primary" href="/agendar-visita">AGENDAR VISITA <CalendarDays /></a></div><div className="trust"><span><ShieldCheck /> Proceso transparente</span><span><Trees /> Ubicaciones con potencial</span><span><CalendarDays /> Visitas personalizadas</span></div></div></section>
    <section className="content-section" id="solares"><div className="content-heading"><span className="kicker"><ImageIcon /> SOLARES</span><h2>Fotos de solares disponibles</h2></div>{solares.length ? <div className="media-grid">{solares.map(item => <article className="media-card" key={item.id}><img src={item.image_url} alt={item.title} /><div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div></article>)}</div> : <div className="empty-content">Muy pronto verás nuevas fotos de solares.</div>}</section>
    <section className="content-section testimonials" id="testimonios"><div className="content-heading"><span className="kicker"><Star /> TESTIMONIOS</span><h2>Testimonio de clientes en sus solares</h2></div>{activeTestimonial ? <div className="testimonial-carousel" onTouchStart={event => setTouchStart(event.touches[0].clientX)} onTouchEnd={event => finishSwipe(event.changedTouches[0].clientX)}><button className="carousel-arrow" type="button" onClick={previousTestimonial} aria-label="Ver testimonio anterior"><ArrowLeft /></button><article className="testimonial-feature" key={activeTestimonial.id}><img src={activeTestimonial.image_url} alt={activeTestimonial.title} /><div><span>Cliente {testimonialIndex + 1} de {testimonios.length}</span><h3>{activeTestimonial.title}</h3>{activeTestimonial.description && <p>{activeTestimonial.description}</p>}</div></article><button className="carousel-arrow" type="button" onClick={nextTestimonial} aria-label="Ver siguiente testimonio"><ArrowRight /></button><div className="carousel-dots">{testimonios.map((item, index) => <button key={item.id} type="button" className={index === testimonialIndex ? 'active' : ''} onClick={() => setTestimonialIndex(index)} aria-label={`Ver testimonio de ${item.title}`} />)}</div></div> : <div className="empty-content">Muy pronto compartiremos testimonios de nuestros clientes.</div>}</section>
    <section className="visit-banner"><div><span className="kicker">CONOCE EL LUGAR</span><h2>Tu próximo proyecto comienza con una visita.</h2></div><a className="btn primary" href="/agendar-visita">VER FECHAS DISPONIBLES <ArrowRight /></a></section>
    <footer id="contacto"><div className="footer-grid"><div><Brand /><p>Solares y terrenos en Punta Cana-Bávaro</p></div><div><b>CONTÁCTANOS</b><a href="#"><MessageCircle/> WhatsApp</a><a href="tel:+18090000000"><Phone/> Teléfono</a><a href="mailto:info@mypuntacanabroker.com"><Mail/> Correo electrónico</a></div><div><b>SÍGUENOS</b><a href="#">◎&nbsp;&nbsp; Instagram</a><a href="#">f&nbsp;&nbsp; Facebook</a><a href="#"><MapPin/> Ubicación</a><a href="/admin"><Settings/> Panel administrativo</a></div></div><div className="copyright"><span>© 2026 My Punta Cana Broker</span><span>Invierte en tierra. Construye tu futuro.</span></div></footer>
  </main>;
}
