'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Save, Video } from 'lucide-react';

function Brand() { return <span className="brand"><span className="logo-mark">M</span><span><b>MY PUNTA CANA</b><small>BROKER</small></span></span>; }

export default function AdminPage() {
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/site-settings', { cache: 'no-store' }).then(async response => {
      const data = await response.json();
      setHeroVideoUrl(data.heroVideoUrl ?? '');
      setSavedUrl(data.heroVideoUrl ?? '');
    }).catch(() => setError('No pudimos cargar la configuración.')).finally(() => setLoading(false));
  }, []);

  async function saveVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    const response = await fetch('/api/site-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ heroVideoUrl }) });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? 'No pudimos guardar el video.');
      return;
    }
    setSavedUrl(data.heroVideoUrl ?? '');
    setHeroVideoUrl(data.heroVideoUrl ?? '');
    setMessage(data.heroVideoUrl ? 'Video actualizado en la página principal.' : 'Video quitado. La portada usará la imagen principal.');
  }

  return <main className="admin-page">
    <header className="schedule-header"><a href="/" aria-label="My Punta Cana Broker, inicio"><Brand /></a><a className="back-link" href="/"><ArrowLeft /> Volver al inicio</a></header>
    <section className="admin-hero"><span className="kicker"><Video /> VIDEO PRINCIPAL</span><h1>Administrar video de portada</h1><p>Pega aquí el enlace directo del video que quieres mostrar en la página principal de My Punta Cana Broker.</p></section>
    <section className="admin-panel">
      <form onSubmit={saveVideo} className="admin-form">
        <label>URL del video
          <input value={heroVideoUrl} onChange={event => setHeroVideoUrl(event.target.value)} placeholder="https://tusitio.com/video-solares.mp4" disabled={loading || saving} />
        </label>
        <p className="admin-help">Recomendado: un enlace directo a un archivo MP4 o WebM. Si dejas el campo vacío, la portada vuelve a usar la imagen actual.</p>
        {error && <div className="admin-error">{error}</div>}
        {message && <div className="admin-success"><CheckCircle2 /> {message}</div>}
        <button className="btn dark admin-save" type="submit" disabled={loading || saving}>{saving ? <Loader2 /> : <Save />} GUARDAR VIDEO</button>
      </form>
      <div className="admin-preview">
        <span className="kicker">VISTA ACTUAL</span>
        <div className="video-preview">{loading ? <Loader2 className="preview-loader" /> : savedUrl ? <video src={savedUrl} controls poster="/hero-solar-v1.png" /> : <img src="/hero-solar-v1.png" alt="Vista previa de la portada" />}</div>
      </div>
    </section>
  </main>;
}
