import 'server-only';
import { createHash } from 'crypto';
import { cookies, headers } from 'next/headers';
import { db } from '@/lib/db';

export const DEVICE_COOKIE = 'jp_device';

// एक ही नेटवर्क + एक ही डिवाइस से, एक पोल में इतने घंटों के भीतर दोबारा वोट नहीं।
// बढ़ाने पर सख्ती बढ़ेगी, पर एक ही वाई-फाई पर एक जैसे दो फ़ोन वालों के रुकने का खतरा भी।
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
  if (!headerName) return null;

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

/** दूसरे ब्राउज़र/इनकॉग्निटो से दोहराया वोट: उसी पोल में, वही नेटवर्क + वही डिवाइस-हस्ताक्षर, हाल ही में */
export async function isRepeatVote(
  pollId: string,
  ipHash: string | null,
  deviceSig: string | null,
) {
  if (!ipHash || !deviceSig) return false;

  const since = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000);

  const vote = await db.vote.findFirst({
    where: { pollId, ipAddress: ipHash, deviceSig, createdAt: { gte: since } },
    select: { id: true },
  });

  return Boolean(vote);
}

/** पोल पेज पर: क्या इसी ब्राउज़र (कुकी) ने इस पोल में वोट दिया है? (IP से किसी को नहीं रोकते) */
export async function hasAlreadyVoted(pollId: string) {
  const deviceId = await getDeviceId();
  if (!deviceId) return false;

  const vote = await db.vote.findUnique({
    where: { pollId_anonymousUserId: { pollId, anonymousUserId: deviceId } },
    select: { id: true },
  });

  return Boolean(vote);
}