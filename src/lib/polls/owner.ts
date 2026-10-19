import 'server-only';
import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { googleAuthOptions } from '@/lib/google-auth';
export async function creatorIdentity(createGuest = false) {
  const session = await getServerSession(googleAuthOptions);
  if (session?.user?.email) return { email: session.user.email, guestHash: null };
  const store = cookies();
  let token = store.get('jp_creator')?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    if (!createGuest) return { email: null, guestHash: null };
    token = randomBytes(32).toString('hex');
    store.set('jp_creator', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 31536000 });
  }
  return { email: null, guestHash: createHash('sha256').update(token).digest('hex') };
}
export async function ownerEmail() { return (await creatorIdentity()).email; }
export async function ownerWhere() {
  const identity = await creatorIdentity();
  const raw = cookies().get('jp_creator')?.value;
  const hash = raw && /^[a-f0-9]{64}$/.test(raw) ? createHash('sha256').update(raw).digest('hex') : null;
  const guest = hash ? { creatorEmail: null, creatorGuestHash: hash } : null;
  if (identity.email) return { OR: [{ creatorEmail: identity.email }, ...(guest ? [guest] : [])] };
  return guest;
}
