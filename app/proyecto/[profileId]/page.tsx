'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Home as HomeIcon, ImageIcon, Mail, MapPin, Menu, MessageCircle, Phone, ShieldCheck, Star, Trees, X } from 'lucide-react';

function Brand() { return <span className="brand"><span className="logo-mark">M</span><span><b>MY PUNTA CANA</b><small>BROKER</small></span></span>; }
type ContentItem = { id: number; type: 'solar' | 'testimonial'; title: string; description?: string; image_url: string };
const defaultTexts = {
  heroEyebrow: 'PUNTA CANA · BÁVARO',
  heroTitle: 'Encuentra tu solar en el centro de Punta Cana-Bávaro, cerca de todo.',
  heroSubtitle: 'Agenda una visita personalizada en Punta Cana-Bávaro de manera rápida y sencilla.',
  offerOne: 'Desde un 15%',
  offerTwo: 'Desde 150$ por mentro',
  builtKicker: 'CASAS CONSTRUIDAS',
  builtTitle: 'Imagina tu casa hecha realidad en Punta Cana-Bávaro.',
  builtText: 'Estos solares son una oportunidad para construir cerca de todo, con una visión clara de comunidad, acceso y futuro crecimiento.',
  solaresKicker: 'SOLARES',
  solaresTitle: 'Fotos de solares disponibles',
  solaresEmpty: 'Muy pronto verás nuevas fotos de solares.',
  testimonialsKicker: 'TESTIMONIOS',
  testimonialsTitle: 'Testimonio de clientes en sus solares',
  testimonialsEmpty: 'Muy pronto compartiremos testimonios de nuestros clientes.',
  visitKicker: 'CONOCE EL LUGAR',
  visitTitle: 'Tu próximo proyecto comienza con una visita.',
  footerTagline: 'Solares y terrenos en Punta Cana-Bávaro',
  footerSlogan: 'Invierte en tierra. Construye tu futuro.'
};

export default function ProjectProfilePage({ params }: { params: { profileId: string } }) {
  const profileId = params.profileId;
  const scheduleHref = `/agendar-visita?profileId=${encodeURIComponent(profileId)}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [solares, setSolares] = useState<ContentItem[]>([]);
  const [testimonios, setTestimonios] = useState<ContentItem[]>([]);
  const [testimonialsEnabled, setTestimonialsEnabled] = useState(true);
  const [texts, setTexts] = useState(defaultTexts);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    const profileQuery = `profileId=${encodeURIComponent(profileId)}`;
    fetch(`/api/site-settings?${profileQuery}`, { cache: 'no-store' }).then(async response => {
      if (response.ok) {
        const data = await response.json();
        setHeroVideoUrl(data.heroVideoUrl ?? '');
        setTestimonialsEnabled(data.testimonialsEnabled !== false);
        setProjectName(data.projectName ?? '');
        setTexts({ ...defaultTexts, ...(data.texts ?? {}) });
      }
    }).catch(() => {});
    fetch(`/api/content?${profileQuery}`, { cache: 'no-store' }).then(async response => {
      if (response.ok) {
        const data = await response.json() as { items?: ContentItem[] };
        const items = data.items ?? [];
        setSolares(items.filter(item => item.type === 'solar'));
        setTestimonios(items.filter(item => item.type === 'testimonial'));
      }
    }).catch(() => {});
  }, [profileId]);

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
    <header className="site-header"><a href="/" aria-label="My Punta Cana Broker, inicio"><Brand /></a><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">{menuOpen ? <X /> : <Menu />}</button><nav className={menuOpen ? 'open' : ''}><a href="#inicio">Inicio</a><a href={scheduleHref}>Agendar Visita</a><a href="#contacto">Contacto</a></nav><a className="header-cta" href={scheduleHref}>AGENDAR VISITA <ArrowRight /></a></header>
    <section id="inicio" className="hero hero-simple"><div className="hero-media" aria-hidden="true">{heroVideoUrl ? <video src={heroVideoUrl} poster="/hero-solar-v1.png" autoPlay muted loop playsInline onError={() => setHeroVideoUrl('')} /> : <img src="/hero-solar-v1.png" alt="" />}</div><div className="hero-shade" aria-hidden="true"/><div className="hero-copy"><span className="eyebrow"><MapPin /> {texts.heroEyebrow}</span>{projectName && <span className="project-badge">{projectName}</span>}<h1>{texts.heroTitle}</h1><p>{texts.heroSubtitle}</p><div className="hero-offers"><span><b>{texts.offerOne}</b></span><span><b>{texts.offerTwo}</b></span></div><div className="hero-actions"><a className="btn primary" href={scheduleHref}>AGENDAR VISITA <CalendarDays /></a><a className="btn outline" href="/">VER WEB PRINCIPAL <ArrowLeft /></a></div><div className="trust"><span><ShieldCheck /> Proceso transparente</span><span><Trees /> Excelente ubicación</span><span><CalendarDays /> Visitas personalizadas</span></div></div></section>
    <section className="built-homes"><div><span className="kicker"><HomeIcon /> {texts.builtKicker}</span><h2>{texts.builtTitle}</h2><p>{texts.builtText}</p><a className="btn primary" href={scheduleHref}>AGENDAR VISITA <ArrowRight /></a></div><img src="/casas-construidas-v1.png" alt="Casas modernas construidas en un residencial tropical" /></section>
    <section className="content-section" id="solares"><div className="content-heading"><span className="kicker"><ImageIcon /> {texts.solaresKicker}</span><h2>{projectName ? `Fotos de ${projectName}` : texts.solaresTitle}</h2></div>{solares.length ? <div className="media-grid">{solares.map(item => <article className="media-card" key={item.id}><img src={item.image_url} alt={item.title} /><div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div></article>)}</div> : <div className="empty-content">{texts.solaresEmpty}</div>}</section>
    {testimonialsEnabled && <section className="content-section testimonials" id="testimonios"><div className="content-heading"><span className="kicker"><Star /> {texts.testimonialsKicker}</span><h2>{texts.testimonialsTitle}</h2></div>{activeTestimonial ? <div className="testimonial-carousel" onTouchStart={event => setTouchStart(event.touches[0].clientX)} onTouchEnd={event => finishSwipe(event.changedTouches[0].clientX)}><button className="carousel-arrow" type="button" onClick={previousTestimonial} aria-label="Ver testimonio anterior"><ArrowLeft /></button><article className="testimonial-feature" key={activeTestimonial.id}><img src={activeTestimonial.image_url} alt={activeTestimonial.title} /><div><span>Cliente {testimonialIndex + 1} de {testimonios.length}</span><h3>{activeTestimonial.title}</h3>{activeTestimonial.description && <p>{activeTestimonial.description}</p>}</div></article><button className="carousel-arrow" type="button" onClick={nextTestimonial} aria-label="Ver siguiente testimonio"><ArrowRight /></button><div className="carousel-dots">{testimonios.map((item, index) => <button key={item.id} type="button" className={index === testimonialIndex ? 'active' : ''} onClick={() => setTestimonialIndex(index)} aria-label={`Ver testimonio de ${item.title}`} />)}</div></div> : <div className="empty-content">{texts.testimonialsEmpty}</div>}</section>}
    <section className="visit-banner"><div><span className="kicker">{texts.visitKicker}</span><h2>{texts.visitTitle}</h2></div><a className="btn primary" href={scheduleHref}>VER FECHAS DISPONIBLES <ArrowRight /></a></section>
    <footer id="contacto"><div className="footer-grid"><div><Brand /><p>{texts.footerTagline}</p></div><div><b>CONTÁCTANOS</b><a href="https://wa.me/18097479704"><MessageCircle/> WhatsApp 809-747-9704</a><a href="tel:+18097479704"><Phone/> Teléfono 809-747-9704</a><a href="mailto:info@mypuntacanabroker.com"><Mail/> Correo electrónico</a></div><div><b>SÍGUENOS</b><a href="https://www.instagram.com/mypuntacanabroker/" target="_blank" rel="noopener noreferrer">◎&nbsp;&nbsp; Instagram</a><a href="https://www.facebook.com/mypuntacanabroker/" target="_blank" rel="noopener noreferrer">f&nbsp;&nbsp; Facebook</a><a href="#"><MapPin/> Ubicación</a></div></div><div className="copyright"><span>© 2026 My Punta Cana Broker</span><span>{texts.footerSlogan}</span></div></footer>
  </main>;
}
