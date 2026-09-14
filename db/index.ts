import { env } from 'cloudflare:workers';
export function getDatabase(): D1Database {
  if (!env.DB) throw new Error('La agenda no está disponible en este momento.');
  return env.DB;
}

export function getMediaBucket(): R2Bucket {
  if (!env.MEDIA) throw new Error('El almacenamiento de imágenes no está disponible en este momento.');
  return env.MEDIA;
}
