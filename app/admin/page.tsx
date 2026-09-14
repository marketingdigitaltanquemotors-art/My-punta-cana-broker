'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ImagePlus, Loader2, Save, Trash2, Upload, Video } from 'lucide-react';

type ContentType = 'solar' | 'testimonial';
type ContentItem = { id: number; type: ContentType; title: string; description?: string; image_url: string };

function Brand() { return <span className="brand"><span className="logo-mark">M</span><span><b>MY PUNTA CANA</b><small>BROKER</small></span></span>; }
const labels = { solar: 'Foto de solar', testimonial: 'Testimonio' };

export default function AdminPage() {
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadAdmin() {
    setLoading(true);
    setError('');
    try {
      const [settingsResponse, contentResponse] = await Promise.all([fetch('/api/site-settings', { cache: 'no-store' }), fetch('/api/content', { cache: 'no-store' })]);
      const settings = await settingsResponse.json();
      const content = await contentResponse.json();
      setHeroVideoUrl(settings.heroVideoUrl ?? '');
      setSavedUrl(settings.heroVideoUrl ?? '');
      setItems(content.items ?? []);
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
    const response = await fetch('/api/site-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ heroVideoUrl }) });
    const data = await response.json();
    setSaving('');
    if (!response.ok) {
      setError(data.error ?? 'No pudimos guardar el video.');
      return;
    }
    setSavedUrl(data.heroVideoUrl ?? '');
    setHeroVideoUrl(data.heroVideoUrl ?? '');
    setMessage(data.heroVideoUrl ? 'Video principal actualizado.' : 'Video quitado. La portada usará la imagen principal.');
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
          <label>URL del video<input value={heroVideoUrl} onChange={event => setHeroVideoUrl(event.target.value)} placeholder="https://tusitio.com/video-solares.mp4" disabled={loading || saving === 'video'} /></label>
          <p className="admin-help">Pega un enlace directo MP4 o WebM. Si lo dejas vacío, la portada usará la imagen principal.</p>
          <button className="btn dark admin-save" type="submit" disabled={loading || saving === 'video'}>{saving === 'video' ? <Loader2 /> : <Save />} GUARDAR VIDEO</button>
          <div className="video-preview compact">{loading ? <Loader2 className="preview-loader" /> : savedUrl ? <video src={savedUrl} controls poster="/hero-solar-v1.png" /> : <img src="/hero-solar-v1.png" alt="Vista previa de la portada" />}</div>
        </form>
        <UploadCard type="solar" title="Subir foto de solar" description="Nombre del solar o ubicación" saving={saving === 'solar'} onSubmit={uploadContent} />
        <UploadCard type="testimonial" title="Subir testimonio" description="Nombre del cliente" saving={saving === 'testimonial'} onSubmit={uploadContent} />
      </div>
      <ContentList title="Fotos de solares publicadas" items={solarItems} deleting={saving} onDelete={deleteContent} />
      <ContentList title="Testimonios publicados" items={testimonialItems} deleting={saving} onDelete={deleteContent} />
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
