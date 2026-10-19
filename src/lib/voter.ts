import 'server-only';
import { createHash } from 'crypto';
import { cookies, headers } from 'next/headers';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { googleAuthOptions } from '@/lib/google-auth';
export const DEVICE_COOKIE = 'jp_device';

// Legacy exported constant retained for compatibility. Current duplicate checks cover the full poll lifetime.
export const DUPLICATE_WINDOW_HOURS = 6;

function normalizeIp(raw: string): string {
  const ip = raw.trim();
  if (ip.toLowerCase().startsWith('::ffff:') && ip.includes('.')) return ip.slice(7);
  if (!ip.includes(':')) return ip;

  // IPv6: पहले 4 हिस्से (/64) एक ही उपयोगकर्ता माने जाएँ
  let parts: string[];
  if (ip.includes('::')) {
    const [head, tail] = ip.split('::');
    const headParts = head ? head.split(':') : [];
    const tailParts = tail ? tail.split(':') : [];
    const zeros = Array<string>(Math.max(0, 8 - headParts.length - tailParts.length)).fill('0');
    parts = [...headParts, ...zeros, ...tailParts];
  } else {
    parts = ip.split(':');
  }
  return parts.slice(0, 4).map((p) => p.padStart(4, '0')).join(':').toLowerCase();
}

// केवल .env में तय किया हुआ भरोसेमंद हेडर पढ़ा जाता है (TRUSTED_IP_HEADER)।
// तय न हो तो IP का उपयोग बंद रहता है, ताकि गलत IP से असली लोग न रुकें।
async function getClientIp(): Promise<string | null> {
  const headerName = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  if (!headerName) {
    if (process.env.NODE_ENV === 'development') {
      const requestHeaders = await headers();
      const host = requestHeaders.get('host') || '';
      if (/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host)) return '127.0.0.1';
    }
    return null;
  }

  const h = await headers();
  const value = h.get(headerName);
  if (!value) return null;

  const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  // x-forwarded-for में आख़िरी एंट्री वही होती है जो आपके सर्वर/ALB ने खुद देखी
  const raw = headerName === 'x-forwarded-for' ? parts[parts.length - 1] : parts[0];
  return normalizeIp(raw);
}

function hashIp(ip: string): string | null {
  const salt = process.env.VOTE_SALT;
  if (!salt) return null;
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

async function getDeviceId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(DEVICE_COOKIE)?.value ?? null;
}

export async function getVoterIdentity() {
  const ip = await getClientIp();
  return {
    ipHash: ip ? hashIp(ip) : null,
    deviceId: await getDeviceId(),
  };
}

/** दूसरे ब्राउज़र/इनकॉग्निटो से दोहराया वोट: उसी पोल में, वही नेटवर्क + वही डिवाइस-हस्ताक्षर, पूरी poll अवधि में */
export async function isRepeatVote(
  pollId: string,
  ipHash: string | null,
  deviceSig: string | null,
) {
  if (!ipHash || !deviceSig) return false;

  const vote = await db.vote.findFirst({
    where: { pollId, ipAddress: ipHash, deviceSig },
    select: { id: true },
  });

  return Boolean(vote);
}

/** पोल पेज पर: क्या इसी ब्राउज़र (कुकी) ने इस पोल में वोट दिया है? (IP से किसी को नहीं रोकते) */
export async function hasAlreadyVoted(pollId: string) {
  const deviceId = await getDeviceId();
  const session = await getServerSession(googleAuthOptions);

  const email = session?.user?.email;

  const user = email
    ? await db.user.findUnique({
        where: { email },
        select: { id: true },
      })
    : null;

  if (!deviceId && !user) return false;

  const vote = await db.vote.findFirst({
    where: {
      pollId,
      OR: [
        ...(deviceId
          ? [{ anonymousUserId: deviceId }]
          : []),
        ...(user
          ? [
              { userId: user.id },
              { anonymousUserId: `user:${user.id}` },
            ]
          : []),
      ],
    },
    select: { id: true },
  });

  return Boolean(vote);
}