import { env } from 'cloudflare:workers';
export function getDatabase(): D1Database {
  if (!env.DB) throw new Error('La agenda no está disponible en este momento.');
  return env.DB;
}
