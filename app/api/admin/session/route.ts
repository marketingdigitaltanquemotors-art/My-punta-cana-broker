import { adminSessionCookie, adminSessionToken, clearAdminSessionCookie, isAdminAuthenticated, validAdminCredentials, validAdminRecoveryCode } from '@/lib/admin-auth';

const sessionHeaders = { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Authorization' };

export async function GET(request: Request) {
  return Response.json({ authenticated: isAdminAuthenticated(request) }, { headers: sessionHeaders });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { username?: string; password?: string; recoveryCode?: string };
  const recovered = typeof body.recoveryCode === 'string' && validAdminRecoveryCode(body.recoveryCode.trim());
  const signedIn = validAdminCredentials(body.username?.trim() ?? '', body.password ?? '');
  if (!recovered && !signedIn) {
    return Response.json({ error: body.recoveryCode ? 'Código de recuperación incorrecto.' : 'Usuario o contraseña incorrectos.' }, { status: 401 });
  }
  return Response.json({ authenticated: true, token: adminSessionToken() }, { headers: { ...sessionHeaders, 'Set-Cookie': adminSessionCookie() } });
}

export async function DELETE() {
  return Response.json({ authenticated: false }, { headers: { ...sessionHeaders, 'Set-Cookie': clearAdminSessionCookie() } });
}
