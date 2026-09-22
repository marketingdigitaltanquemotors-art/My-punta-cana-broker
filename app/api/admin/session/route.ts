import { adminSessionCookie, adminSessionToken, clearAdminSessionCookie, isAdminAuthenticated, saveAdminCredentials, validAdminCredentials, validAdminRecoveryCode } from '@/lib/admin-auth';

const sessionHeaders = { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Authorization' };

export async function GET(request: Request) {
  return Response.json({ authenticated: isAdminAuthenticated(request) }, { headers: sessionHeaders });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { username?: string; password?: string; recoveryCode?: string; newUsername?: string; newPassword?: string };
  const recovered = typeof body.recoveryCode === 'string' && validAdminRecoveryCode(body.recoveryCode.trim());
  if (body.recoveryCode && !recovered) {
    return Response.json({ error: 'Código de recuperación incorrecto.' }, { status: 401 });
  }
  if (recovered && !body.newUsername && !body.newPassword) {
    return Response.json({ recoveryVerified: true }, { headers: sessionHeaders });
  }
  if (recovered) {
    const newUsername = body.newUsername?.trim() ?? '';
    const newPassword = body.newPassword ?? '';
    if (newUsername.length < 4 || newPassword.length < 8) {
      return Response.json({ error: 'El usuario debe tener al menos 4 caracteres y la contraseña al menos 8.' }, { status: 400 });
    }
    await saveAdminCredentials(newUsername, newPassword);
    return Response.json({ authenticated: true, token: adminSessionToken() }, { headers: { ...sessionHeaders, 'Set-Cookie': adminSessionCookie() } });
  }
  const signedIn = await validAdminCredentials(body.username?.trim() ?? '', body.password ?? '');
  if (!recovered && !signedIn) {
    return Response.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 });
  }
  return Response.json({ authenticated: true, token: adminSessionToken() }, { headers: { ...sessionHeaders, 'Set-Cookie': adminSessionCookie() } });
}

export async function DELETE() {
  return Response.json({ authenticated: false }, { headers: { ...sessionHeaders, 'Set-Cookie': clearAdminSessionCookie() } });
}
