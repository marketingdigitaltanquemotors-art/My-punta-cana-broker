import { adminSessionCookie, clearAdminSessionCookie, isAdminAuthenticated, validAdminCredentials } from '@/lib/admin-auth';

export async function GET(request: Request) {
  return Response.json({ authenticated: isAdminAuthenticated(request) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { username?: string; password?: string };
  if (!validAdminCredentials(body.username?.trim() ?? '', body.password ?? '')) {
    return Response.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 });
  }
  return Response.json({ authenticated: true }, { headers: { 'Set-Cookie': adminSessionCookie() } });
}

export async function DELETE() {
  return Response.json({ authenticated: false }, { headers: { 'Set-Cookie': clearAdminSessionCookie() } });
}
