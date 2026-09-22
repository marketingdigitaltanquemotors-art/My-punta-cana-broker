import { getDatabase } from '@/db';

const COOKIE_NAME = 'mpcb_admin_session';
const SESSION_VALUE = 'mpcb-admin-authenticated-v1';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'mypuntacana2026';
const ADMIN_RECOVERY_CODE = process.env.ADMIN_RECOVERY_CODE ?? '';

type AdminCredential = { username: string; password_hash: string; password_salt: string };

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get('cookie') ?? '';
  return cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.split('=').slice(1).join('=') ?? '';
}

export function isAdminAuthenticated(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  return readCookie(request, COOKIE_NAME) === SESSION_VALUE || bearerToken === SESSION_VALUE;
}

export function adminSessionToken() {
  return SESSION_VALUE;
}

export function requireAdmin(request: Request) {
  if (isAdminAuthenticated(request)) return null;
  return Response.json({ error: 'Debes iniciar sesión para administrar el panel.' }, { status: 401 });
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

async function passwordHash(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 120000 }, key, 256);
  return new Uint8Array(bits);
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function validAdminCredentials(username: string, password: string) {
  const stored = await getDatabase().prepare('SELECT username, password_hash, password_salt FROM admin_credentials WHERE id = 1').first<AdminCredential>();
  if (!stored) return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  if (username !== stored.username) return false;
  const calculated = await passwordHash(password, base64ToBytes(stored.password_salt));
  return equalBytes(calculated, base64ToBytes(stored.password_hash));
}

export function validAdminRecoveryCode(recoveryCode: string) {
  return Boolean(ADMIN_RECOVERY_CODE) && recoveryCode === ADMIN_RECOVERY_CODE;
}

export async function saveAdminCredentials(username: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await passwordHash(password, salt);
  await getDatabase().prepare(`
    INSERT INTO admin_credentials (id, username, password_hash, password_salt, updated_at)
    VALUES (1, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      password_hash = excluded.password_hash,
      password_salt = excluded.password_salt,
      updated_at = excluded.updated_at
  `).bind(username, bytesToBase64(hash), bytesToBase64(salt), Math.floor(Date.now() / 1000)).run();
}

export function adminSessionCookie() {
  return `${COOKIE_NAME}=${SESSION_VALUE}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`;
}

export function clearAdminSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
