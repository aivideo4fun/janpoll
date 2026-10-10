import 'server-only';
import { createHash } from 'crypto';
import { cookies, headers } from 'next/headers';
import { db } from '@/lib/db';

export const DEVICE_COOKIE = 'jp_device';

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const raw =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    null;

  if (!raw) return null;

  if (raw.includes(':')) {
    return raw.split(':').slice(0, 4).join(':');
  }
  return raw;
}

function hashIp(ip: string) {
  const salt = process.env.VOTE_SALT;
  return createHash('sha256')
    .update(`${salt ?? 'janpoll-default-salt'}:${ip}`)
    .digest('hex')
    .slice(0, 32);
}

export async function getVoterIdentity() {
  const ip = await getClientIp();
  const cookieStore = await cookies();

  return {
    ipHash: ip ? hashIp(ip) : null,
    deviceId: cookieStore.get(DEVICE_COOKIE)?.value ?? null,
  };
}

/** 
 * पोल पेज पर जाँच करें: 
 * केवल यह देखा जाएगा कि क्या इस विशिष्ट डिवाइस/कुकी ने इस पोल पर पहले वोट दिया है या नहीं। 
 * IP की कोई पाबंदी नहीं रहेगी, ताकि एक ही इंटरनेट/वाई-फाई से नए लोग आसानी से वोट दे सकें।
 */
export async function hasAlreadyVoted(pollId: string) {
  const { deviceId } = await getVoterIdentity();

  if (!deviceId) return false;

  const vote = await db.vote.findUnique({
    where: {
      pollId_anonymousUserId: {
        pollId,
        anonymousUserId: deviceId,
      },
    },
    select: { id: true },
  });

  return !!vote;
}