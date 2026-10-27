const encoder = new TextEncoder();

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const COOKIE = 'pa_admin';

export async function signSession(secret: string, maxAgeSec: number): Promise<{ value: string; maxAge: number }> {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const sig = await hmac(secret, String(exp));
  return { value: `${exp}.${sig}`, maxAge: maxAgeSec };
}

export async function verifySession(secret: string, cookieVal: string | undefined): Promise<boolean> {
  if (!cookieVal) return false;
  const [expRaw, sig] = cookieVal.split('.');
  if (!expRaw || !sig) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  const expected = await hmac(secret, expRaw);
  return sig === expected;
}

export function cookieHeader(value: string, maxAge: number): string {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearCookieHeader(): string {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readCookie(request: Request, name: string): string | undefined {
  const raw = request.headers.get('Cookie');
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return undefined;
}

export async function isAdmin(request: Request, secret: string): Promise<boolean> {
  return verifySession(secret, readCookie(request, COOKIE));
}
