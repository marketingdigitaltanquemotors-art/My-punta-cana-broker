'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarCheck, CheckCircle2, Eye, EyeOff, ImagePlus, Loader2, Save, Trash2, Upload, Video } from 'lucide-react';

type ContentType = 'solar' | 'testimonial';
type ContentItem = { id: number; type: ContentType; title: string; description?: string; image_url: string };
type Appointment = { id: number; appointment_date: string; appointment_time: string; client_name: string; phone: string; email: string; reservation_code: string; created_at: number };

function Brand() { return <span className="brand"><span className="logo-mark">M</span><span><b>MY PUNTA CANA</b><small>BROKER</small></span></span>; }
const labels = { solar: 'Foto de solar', testimonial: 'Testimonio' };

export default function AdminPage() {
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [testimonialsEnabled, setTestimonialsEnabled] = useState(true);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadAdmin() {
    setLoading(true);
    setError('');
    try {
      const [settingsResponse, contentResponse, appointmentsResponse] = await Promise.all([fetch('/api/site-settings', { cache: 'no-store' }), fetch('/api/content', { cache: 'no-store' }), fetch('/api/admin/appointments', { cache: 'no-store' })]);
      const settings = await settingsResponse.json();
      const content = await contentResponse.json();
      const appointmentsData = await appointmentsResponse.json();
      setHeroVideoUrl(settings.heroVideoUrl ?? '');
      setSavedUrl(settings.heroVideoUrl ?? '');
      setTestimonialsEnabled(settings.testimonialsEnabled !== false);
      setItems(content.items ?? []);
      setAppointments(appointmentsData.appointments ?? []);
    } catch {
      setError('No pudimos cargar el panel.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAdmin(); }, []);

  async function saveVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving('video');
    setMessage('');
    setError('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/site-settings', { method: 'PUT', body: form });
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
    const response = await fetch('/api/site-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ heroVideoUrl: '' }) });
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

  async function toggleTestimonials() {
    const nextValue = !testimonialsEnabled;
    setSaving('testimonials-toggle');
    setMessage('');
    setError('');
    const response = await fetch('/api/site-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ testimonialsEnabled: nextValue }) });
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
    const response = await fetch('/api/content', { method: 'POST', body: form });
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
    const response = await fetch(`/api/content?id=${id}`, { method: 'DELETE' });
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
    const response = await fetch(`/api/admin/appointments?id=${id}`, { method: 'DELETE' });
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

  return <main className="admin-page">
    <header className="schedule-header"><a href="/" aria-label="My Punta Cana Broker, inicio"><Brand /></a><a className="back-link" href="/"><ArrowLeft /> Volver al inicio</a></header>
    <section className="admin-hero"><span className="kicker"><ImagePlus /> PANEL ADMINISTRATIVO</span><h1>Administrar contenido</h1><p>Actualiza el video principal, sube fotos de solares y publica testimonios con fotos de clientes en sus solares.</p></section>
    <section className="admin-shell">
      {error && <div className="admin-error">{error}</div>}
      {message && <div className="admin-success"><CheckCircle2 /> {message}</div>}
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
  return <section className="admin-list appointments-list"><span className="kicker"><CalendarCheck /> CITAS</span><h2>Citas agendadas</h2>{appointments.length ? <div className="appointments-table"><table><thead><tr><th>Cliente</th><th>WhatsApp</th><th>Correo</th><th>Fecha</th><th>Hora</th><th>Código</th><th>Acción</th></tr></thead><tbody>{appointments.map(appointment => <tr key={appointment.id}><td>{appointment.client_name}</td><td><a href={`https://wa.me/${appointment.phone.replace(/\D/g, '')}`}>{appointment.phone}</a></td><td><a href={`mailto:${appointment.email}`}>{appointment.email}</a></td><td>{appointment.appointment_date}</td><td>{appointment.appointment_time}</td><td><b>{appointment.reservation_code}</b></td><td><button className="table-delete" type="button" onClick={() => onDelete(appointment.id)} disabled={deleting === `appointment-${appointment.id}`} aria-label={`Eliminar cita de ${appointment.client_name}`}>{deleting === `appointment-${appointment.id}` ? <Loader2 /> : <Trash2 />}</button></td></tr>)}</tbody></table></div> : <p className="admin-help">Todavía no hay citas agendadas.</p>}</section>;
}
