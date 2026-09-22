'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, CalendarCheck, CheckCircle2, Copy, ExternalLink, Eye, EyeOff, ImagePlus, Loader2, LogOut, LockKeyhole, Save, Trash2, Upload, Video } from 'lucide-react';

type ContentType = 'solar' | 'testimonial';
type ContentItem = { id: number; type: ContentType; title: string; description?: string; image_url: string };
type Appointment = { id: number; profile_id?: number; profile_name?: string; appointment_date: string; appointment_time: string; client_name: string; phone: string; email: string; reservation_code: string; created_at: number };
type ProjectProfile = { id: number; name: string; created_at: number };
type SiteTexts = typeof defaultTexts;

function Brand() { return <span className="brand"><span className="logo-mark">M</span><span><b>MY PUNTA CANA</b><small>BROKER</small></span></span>; }
const labels = { solar: 'Foto de solar', testimonial: 'Testimonio' };
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
const textFields: { key: keyof SiteTexts; label: string; multiline?: boolean }[] = [
  { key: 'heroEyebrow', label: 'Etiqueta del hero' },
  { key: 'heroTitle', label: 'Título principal', multiline: true },
  { key: 'heroSubtitle', label: 'Texto debajo del título', multiline: true },
  { key: 'offerOne', label: 'Oferta 1' },
  { key: 'offerTwo', label: 'Oferta 2' },
  { key: 'builtKicker', label: 'Etiqueta de casas construidas' },
  { key: 'builtTitle', label: 'Título de casas construidas', multiline: true },
  { key: 'builtText', label: 'Texto de casas construidas', multiline: true },
  { key: 'solaresKicker', label: 'Etiqueta de solares' },
  { key: 'solaresTitle', label: 'Título de solares' },
  { key: 'solaresEmpty', label: 'Texto cuando no hay fotos', multiline: true },
  { key: 'testimonialsKicker', label: 'Etiqueta de testimonios' },
  { key: 'testimonialsTitle', label: 'Título de testimonios' },
  { key: 'testimonialsEmpty', label: 'Texto cuando no hay testimonios', multiline: true },
  { key: 'visitKicker', label: 'Etiqueta de llamado a visita' },
  { key: 'visitTitle', label: 'Título de llamado a visita', multiline: true },
  { key: 'footerTagline', label: 'Texto del footer' },
  { key: 'footerSlogan', label: 'Frase final del footer' }
];

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loginDetails, setLoginDetails] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [profiles, setProfiles] = useState<ProjectProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState(1);
  const [newProfileName, setNewProfileName] = useState('');
  const [testimonialsEnabled, setTestimonialsEnabled] = useState(true);
  const [texts, setTexts] = useState<SiteTexts>(defaultTexts);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    const token = sessionStorage.getItem('mpcb_admin_token');
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, credentials: 'include', headers });
  }

  async function loadAdmin() {
    setLoading(true);
    setError('');
    try {
      const [profilesResponse, settingsResponse, contentResponse, appointmentsResponse] = await Promise.all([adminFetch('/api/project-profiles', { cache: 'no-store' }), adminFetch('/api/site-settings', { cache: 'no-store' }), adminFetch('/api/content', { cache: 'no-store' }), adminFetch('/api/admin/appointments', { cache: 'no-store' })]);
      const profileData = await profilesResponse.json();
      const settings = await settingsResponse.json();
      const content = await contentResponse.json();
      const appointmentsData = await appointmentsResponse.json();
      setProfiles(profileData.profiles ?? []);
      setActiveProfileId(profileData.activeProfileId ?? 1);
      setHeroVideoUrl(settings.heroVideoUrl ?? '');
      setSavedUrl(settings.heroVideoUrl ?? '');
      setTestimonialsEnabled(settings.testimonialsEnabled !== false);
      setTexts({ ...defaultTexts, ...(settings.texts ?? {}) });
      setItems(content.items ?? []);
      setAppointments(appointmentsData.appointments ?? []);
    } catch {
      setError('No pudimos cargar el panel.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    adminFetch('/api/admin/session', { cache: 'no-store' }).then(async response => {
      const data = await response.json();
      setAuthenticated(Boolean(data.authenticated));
      if (data.authenticated) await loadAdmin();
    }).catch(() => {}).finally(() => setCheckingSession(false));
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving('login');
    setLoginError('');
    const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginDetails) });
    const data = await response.json();
    setSaving('');
    if (!response.ok) {
      setLoginError(data.error ?? 'No pudimos iniciar sesión.');
      return;
    }
    sessionStorage.setItem('mpcb_admin_token', data.token);
    setAuthenticated(true);
    setLoginDetails({ username: '', password: '' });
    await loadAdmin();
  }

  async function logout() {
    await adminFetch('/api/admin/session', { method: 'DELETE' });
    sessionStorage.removeItem('mpcb_admin_token');
    setAuthenticated(false);
    setProfiles([]);
    setItems([]);
    setAppointments([]);
  }

  async function saveVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving('video');
    setMessage('');
    setError('');
    const form = new FormData(event.currentTarget);
    const response = await adminFetch('/api/site-settings', { method: 'PUT', body: form });
    const data = await response.json();
    setSaving('');
    if (!response.ok) {
      setError(data.error ?? 'No pudimos guardar el video.');
      return;
    }
    setSavedUrl(data.heroVideoUrl ?? '');
    setHeroVideoUrl(data.heroVideoUrl ?? '');
    event.currentTarget.reset();
    setMessage('Video principal subido y actualizado.');
  }

  async function removeVideo() {
    setSaving('video');
    setMessage('');
    setError('');
    const response = await adminFetch('/api/site-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ heroVideoUrl: '' }) });
    const data = await response.json();
    setSaving('');
    if (!response.ok) {
      setError(data.error ?? 'No pudimos quitar el video.');
      return;
    }
    setSavedUrl('');
    setHeroVideoUrl('');
    setMessage('Video quitado. La portada usará la imagen principal.');
  }

  async function createProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newProfileName.trim();
    if (!name) return;
    setSaving('create-profile');
    setMessage('');
    setError('');
    const response = await adminFetch('/api/project-profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await response.json();
    setSaving('');
    if (!response.ok) {
      setError(data.error ?? 'No pudimos crear el perfil.');
      return;
    }
    setNewProfileName('');
    setMessage('Perfil creado y activado.');
    await loadAdmin();
  }

  async function selectProfile(id: number) {
    if (id === activeProfileId) return;
    setSaving('select-profile');
    setMessage('');
    setError('');
    const response = await adminFetch('/api/project-profiles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activeProfileId: id }) });
    const data = await response.json();
    setSaving('');
    if (!response.ok) {
      setError(data.error ?? 'No pudimos activar el perfil.');
      return;
    }
    setMessage('Perfil activado.');
    await loadAdmin();
  }

  async function deleteProfile(profile: ProjectProfile) {
    if (profiles.length <= 1) {
      setError('Debes dejar al menos un perfil.');
      return;
    }
    const confirmed = window.confirm(`¿Eliminar el perfil "${profile.name}"? También se eliminarán sus fotos, testimonios y citas.`);
    if (!confirmed) return;
    setSaving(`profile-${profile.id}`);
    setMessage('');
    setError('');
    const response = await adminFetch(`/api/project-profiles?id=${profile.id}`, { method: 'DELETE' });
    const data = await response.json();
    setSaving('');
    if (!response.ok) {
      setError(data.error ?? 'No pudimos eliminar el perfil.');
      return;
    }
    setMessage('Perfil eliminado.');
    await loadAdmin();
  }

  async function saveTexts(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving('texts');
    setMessage('');
    setError('');
    const response = await adminFetch('/api/site-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texts }) });
    const data = await response.json();
    setSaving('');
    if (!response.ok) {
      setError(data.error ?? 'No pudimos guardar los textos.');
      return;
    }
    setTexts({ ...defaultTexts, ...(data.texts ?? texts) });
    setMessage('Textos de la página actualizados.');
  }

  async function toggleTestimonials() {
    const nextValue = !testimonialsEnabled;
    setSaving('testimonials-toggle');
    setMessage('');
    setError('');
    const response = await adminFetch('/api/site-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ testimonialsEnabled: nextValue }) });
    const data = await response.json();
    setSaving('');
    if (!response.ok) {
      setError(data.error ?? 'No pudimos cambiar el estado de testimonios.');
      return;
    }
    setTestimonialsEnabled(nextValue);
    setMessage(nextValue ? 'Testimonios activados en la página principal.' : 'Testimonios desactivados de la página principal.');
  }

  async function uploadContent(event: React.FormEvent<HTMLFormElement>, type: ContentType) {
    event.preventDefault();
    setSaving(type);
    setMessage('');
    setError('');
    const form = new FormData(event.currentTarget);
    form.set('type', type);
    const response = await adminFetch('/api/content', { method: 'POST', body: form });
    const data = await response.json();
    setSaving('');
    if (!response.ok) {
      setError(data.error ?? 'No pudimos subir el contenido.');
      return;
    }
    event.currentTarget.reset();
    setItems(current => [data.item, ...current]);
    setMessage(type === 'solar' ? 'Foto de solar publicada en la página principal.' : 'Testimonio publicado en la página principal.');
  }

  async function deleteContent(id: number) {
    setSaving(`delete-${id}`);
    setMessage('');
    setError('');
    const response = await adminFetch(`/api/content?id=${id}`, { method: 'DELETE' });
    const data = await response.json();
    setSaving('');
    if (!response.ok) {
      setError(data.error ?? 'No pudimos borrar el contenido.');
      return;
    }
    setItems(current => current.filter(item => item.id !== id));
    setMessage('Contenido eliminado.');
  }

  async function deleteAppointment(id: number) {
    setSaving(`appointment-${id}`);
    setMessage('');
    setError('');
    const response = await adminFetch(`/api/admin/appointments?id=${id}`, { method: 'DELETE' });
    const data = await response.json();
    setSaving('');
    if (!response.ok) {
      setError(data.error ?? 'No pudimos eliminar la cita.');
      return;
    }
    setAppointments(current => current.filter(appointment => appointment.id !== id));
    setMessage('Cita eliminada.');
  }

  const solarItems = items.filter(item => item.type === 'solar');
  const testimonialItems = items.filter(item => item.type === 'testimonial');
  const publicProfileUrl = (id: number) => typeof window === 'undefined' ? `/proyecto/${id}` : `${window.location.origin}/proyecto/${id}`;
  async function copyProfileLink(id: number) {
    await navigator.clipboard?.writeText(publicProfileUrl(id));
    setMessage('Enlace del perfil copiado.');
  }

  if (checkingSession) return <main className="admin-page"><header className="schedule-header"><a href="/" aria-label="My Punta Cana Broker, inicio"><Brand /></a><a className="back-link" href="/"><ArrowLeft /> Volver al inicio</a></header><section className="admin-login"><Loader2 className="preview-loader" /><p>Verificando acceso…</p></section></main>;

  if (!authenticated) return <main className="admin-page">
    <header className="schedule-header"><a href="/" aria-label="My Punta Cana Broker, inicio"><Brand /></a><a className="back-link" href="/"><ArrowLeft /> Volver al inicio</a></header>
    <section className="admin-login">
      <form className="login-card" onSubmit={login}>
        <span className="kicker"><LockKeyhole /> ACCESO PRIVADO</span>
        <h1>Panel administrativo</h1>
        <p>Inicia sesión para administrar perfiles, citas, fotos, testimonios y textos de My Punta Cana Broker.</p>
        {loginError && <div className="admin-error">{loginError}</div>}
        <label>Usuario<input value={loginDetails.username} onChange={event => setLoginDetails(current => ({ ...current, username: event.target.value }))} autoComplete="username" required /></label>
        <label>Contraseña<input type="password" value={loginDetails.password} onChange={event => setLoginDetails(current => ({ ...current, password: event.target.value }))} autoComplete="current-password" required /></label>
        <button className="btn dark admin-save" type="submit" disabled={saving === 'login'}>{saving === 'login' ? <Loader2 /> : <LockKeyhole />} ENTRAR AL PANEL</button>
        <a className="forgot-password" href="mailto:marketingdigitaltanquemotors@gmail.com?subject=Recuperar%20acceso%20al%20panel%20administrativo">¿Olvidaste tu contraseña? <span>Recuperar cuenta</span></a>
      </form>
    </section>
  </main>;

  return <main className="admin-page">
    <header className="schedule-header"><a href="/" aria-label="My Punta Cana Broker, inicio"><Brand /></a><div className="admin-header-actions"><button type="button" onClick={logout}><LogOut /> Cerrar sesión</button><a className="back-link" href="/"><ArrowLeft /> Volver al inicio</a></div></header>
    <section className="admin-hero"><span className="kicker"><ImagePlus /> PANEL ADMINISTRATIVO</span><h1>Administrar contenido</h1><p>Actualiza el video principal, sube fotos de solares y publica testimonios con fotos de clientes en sus solares.</p></section>
    <section className="admin-shell">
      {error && <div className="admin-error">{error}</div>}
      {message && <div className="admin-success"><CheckCircle2 /> {message}</div>}
      <section className="admin-list profile-manager">
        <span className="kicker"><Building2 /> PERFILES DE PROYECTO</span>
        <h2>Administrar perfiles</h2>
        <p className="admin-help">Cada perfil guarda su nombre de proyecto, video principal, fotos de solares, testimonios y citas por separado. La página principal muestra el perfil activo.</p>
        <div className="profile-links">{profiles.map(profile => <div className={profile.id === activeProfileId ? 'profile-link active' : 'profile-link'} key={profile.id}>
          <button type="button" onClick={() => selectProfile(profile.id)} disabled={saving === 'select-profile'}>{profile.name}<small>{profile.id === activeProfileId ? 'Perfil activo' : 'Activar perfil'}</small></button>
          <a href={`/proyecto/${profile.id}`} target="_blank" rel="noopener noreferrer"><ExternalLink /> Abrir web</a>
          <button type="button" className="copy-link" onClick={() => copyProfileLink(profile.id)}><Copy /> Copiar enlace</button>
          <button type="button" className="delete-profile" onClick={() => deleteProfile(profile)} disabled={profiles.length <= 1 || saving === `profile-${profile.id}`}>{saving === `profile-${profile.id}` ? <Loader2 /> : <Trash2 />} Eliminar</button>
        </div>)}</div>
        <form className="profile-create" onSubmit={createProfile}>
          <input value={newProfileName} onChange={event => setNewProfileName(event.target.value)} placeholder="Nombre del nuevo proyecto o lotificación" disabled={saving === 'create-profile'} />
          <button className="btn dark" type="submit" disabled={saving === 'create-profile'}>{saving === 'create-profile' ? <Loader2 /> : <Building2 />} CREAR PERFIL</button>
        </form>
      </section>
      <form className="admin-list advanced-texts" onSubmit={saveTexts}>
        <span className="kicker"><Save /> CONFIGURACIÓN AVANZADA</span>
        <h2>Editar textos de la página</h2>
        <p className="admin-help">Estos textos se guardan en el perfil activo. Si cambias a otro perfil, podrás tener textos diferentes para esa web.</p>
        <div className="text-editor-grid">{textFields.map(field => <label key={field.key}>{field.label}{field.multiline ? <textarea value={texts[field.key]} onChange={event => setTexts(current => ({ ...current, [field.key]: event.target.value }))} /> : <input value={texts[field.key]} onChange={event => setTexts(current => ({ ...current, [field.key]: event.target.value }))} />}</label>)}</div>
        <button className="btn dark admin-save" type="submit" disabled={saving === 'texts'}>{saving === 'texts' ? <Loader2 /> : <Save />} GUARDAR TEXTOS</button>
      </form>
      <div className="admin-grid">
        <form onSubmit={saveVideo} className="admin-card">
          <span className="kicker"><Video /> VIDEO PRINCIPAL</span>
          <label>Subir video desde la PC<input name="heroVideo" type="file" accept="video/mp4,video/webm,video/quicktime" disabled={loading || saving === 'video'} required /></label>
          <p className="admin-help">Acepta MP4, WebM o MOV de hasta 80 MB. Al guardarlo, la portada usará ese video automáticamente.</p>
          <button className="btn dark admin-save" type="submit" disabled={loading || saving === 'video'}>{saving === 'video' ? <Loader2 /> : <Save />} SUBIR VIDEO</button>
          <button className="remove-video" type="button" onClick={removeVideo} disabled={loading || saving === 'video' || !heroVideoUrl}>QUITAR VIDEO</button>
          <div className="video-preview compact">{loading ? <Loader2 className="preview-loader" /> : savedUrl ? <video src={savedUrl} controls poster="/hero-solar-v1.png" /> : <img src="/hero-solar-v1.png" alt="Vista previa de la portada" />}</div>
        </form>
        <UploadCard type="solar" title="Subir foto de solar" description="Nombre del solar o ubicación" saving={saving === 'solar'} onSubmit={uploadContent} />
        <UploadCard type="testimonial" title="Subir testimonio" description="Nombre del cliente" saving={saving === 'testimonial'} onSubmit={uploadContent} />
        <section className="admin-card">
          <span className="kicker">{testimonialsEnabled ? <Eye /> : <EyeOff />} TESTIMONIOS</span>
          <h2>Mostrar testimonios</h2>
          <p className="admin-help">Activa o desactiva el apartado de testimonios en la página principal sin borrar las fotos ni los textos guardados.</p>
          <button className="btn dark admin-save" type="button" onClick={toggleTestimonials} disabled={loading || saving === 'testimonials-toggle'}>{saving === 'testimonials-toggle' ? <Loader2 /> : testimonialsEnabled ? <EyeOff /> : <Eye />} {testimonialsEnabled ? 'DESACTIVAR' : 'ACTIVAR'}</button>
        </section>
      </div>
      <ContentList title="Fotos de solares publicadas" items={solarItems} deleting={saving} onDelete={deleteContent} />
      <ContentList title="Testimonios publicados" items={testimonialItems} deleting={saving} onDelete={deleteContent} />
      <AppointmentsList appointments={appointments} deleting={saving} onDelete={deleteAppointment} />
    </section>
  </main>;
}

function UploadCard({ type, title, description, saving, onSubmit }: { type: ContentType; title: string; description: string; saving: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>, type: ContentType) => void }) {
  return <form className="admin-card" onSubmit={event => onSubmit(event, type)}>
    <span className="kicker"><Upload /> {labels[type]}</span>
    <h2>{title}</h2>
    <label>{description}<input name="title" placeholder={type === 'solar' ? 'Solar en Punta Cana-Bávaro' : 'Nombre del cliente'} required /></label>
    <label>{type === 'solar' ? 'Descripción' : 'Testimonio'}<textarea name="description" placeholder={type === 'solar' ? 'Ejemplo: cerca de avenidas principales, ideal para construir.' : 'Ejemplo: Ya tengo mi solar y el proceso fue claro desde el primer día.'} /></label>
    <label>Foto<input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required /></label>
    <button className="btn dark admin-save" type="submit" disabled={saving}>{saving ? <Loader2 /> : <Upload />} SUBIR</button>
  </form>;
}

function ContentList({ title, items, deleting, onDelete }: { title: string; items: ContentItem[]; deleting: string; onDelete: (id: number) => void }) {
  return <section className="admin-list"><h2>{title}</h2>{items.length ? <div className="admin-items">{items.map(item => <article key={item.id} className="admin-item"><img src={item.image_url} alt={item.title} /><div><b>{item.title}</b>{item.description && <p>{item.description}</p>}</div><button type="button" onClick={() => onDelete(item.id)} disabled={deleting === `delete-${item.id}`} aria-label={`Eliminar ${item.title}`}>{deleting === `delete-${item.id}` ? <Loader2 /> : <Trash2 />}</button></article>)}</div> : <p className="admin-help">Todavía no hay contenido en esta sección.</p>}</section>;
}

function AppointmentsList({ appointments, deleting, onDelete }: { appointments: Appointment[]; deleting: string; onDelete: (id: number) => void }) {
  return <section className="admin-list appointments-list"><span className="kicker"><CalendarCheck /> CITAS</span><h2>Citas agendadas</h2>{appointments.length ? <div className="appointments-table"><table><thead><tr><th>Proyecto de interés</th><th>Cliente</th><th>WhatsApp</th><th>Correo</th><th>Fecha</th><th>Hora</th><th>Código</th><th>Acción</th></tr></thead><tbody>{appointments.map(appointment => <tr key={appointment.id}><td><b>{appointment.profile_name ?? 'Perfil principal'}</b></td><td>{appointment.client_name}</td><td><a href={`https://wa.me/${appointment.phone.replace(/\D/g, '')}`}>{appointment.phone}</a></td><td><a href={`mailto:${appointment.email}`}>{appointment.email}</a></td><td>{appointment.appointment_date}</td><td>{appointment.appointment_time}</td><td><b>{appointment.reservation_code}</b></td><td><button className="table-delete" type="button" onClick={() => onDelete(appointment.id)} disabled={deleting === `appointment-${appointment.id}`} aria-label={`Eliminar cita de ${appointment.client_name}`}>{deleting === `appointment-${appointment.id}` ? <Loader2 /> : <Trash2 />}</button></td></tr>)}</tbody></table></div> : <p className="admin-help">Todavía no hay citas agendadas.</p>}</section>;
}
