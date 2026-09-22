const COOKIE_NAME = 'mpcb_admin_session';
const SESSION_VALUE = 'mpcb-admin-authenticated-v1';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'mypuntacana2026';
const ADMIN_RECOVERY_CODE = process.env.ADMIN_RECOVERY_CODE ?? '';

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

export function validAdminCredentials(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function validAdminRecoveryCode(recoveryCode: string) {
  return Boolean(ADMIN_RECOVERY_CODE) && recoveryCode === ADMIN_RECOVERY_CODE;
}

export function adminSessionCookie() {
  return `${COOKIE_NAME}=${SESSION_VALUE}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`;
}

export function clearAdminSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
