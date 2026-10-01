import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'janpoll_admin_auth';
const MAX_AGE_SECONDS = 60 * 60 * 24; // 1 दिन

export function adminConfigured() {
  return Boolean(
    process.env.ADMIN_USER?.trim() &&
      process.env.ADMIN_PASS?.trim() &&
      process.env.ADMIN_SECRET &&
      process.env.ADMIN_SECRET.length >= 16,
  );
}

function sign(payload: string) {
  return createHmac('sha256', process.env.ADMIN_SECRET as string)
    .update(payload)
    .digest('hex');
}

// Timing attack से बचने के लिए constant-time तुलना
export function safeEqual(a: string, b: string) {
  const ha = createHmac('sha256', 'cmp').update(a).digest();
  const hb = createHmac('sha256', 'cmp').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function createAdminSession() {
  const payload = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdmin() {
  if (!adminConfigured()) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload);
  if (signature.length !== expected.length) return false;

  const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  return valid && Number(payload) > Date.now();
}