import 'server-only';
import { createHash } from 'crypto';
import { cookies, headers } from 'next/headers';

import { db } from '@/lib/db';

export const DEVICE_COOKIE = 'jp_device';

// एक पोल में एक ही नेटवर्क (IP) से अधिकतम इतने वोट मान्य होंगे।
// 1 रखने पर एक ही वाई-फाई/नेटवर्क के बाकी असली लोग भी रुक जाएंगे।
export const MAX_VOTES_PER_IP = 3;

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const raw =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    null;

  if (!raw) return null;

  // IPv6: पूरा /64 block एक ही user माना जाए, वरना IP बदलकर bypass हो सकता है
  if (raw.includes(':')) {
    return raw.split(':').slice(0, 4).join(':');
  }
  return raw;
}

function hashIp(ip: string) {
  const salt = process.env.VOTE_SALT;
  if (!salt) {
    console.warn('VOTE_SALT सेट नहीं है, कृपया .env में जोड़ें।');
  }
  // 32 hex chars = ipAddress VarChar(45) में fit
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

/** क्या इस पोल में इस नेटवर्क (IP) की वोट-सीमा पूरी हो चुकी है? */
export async function isIpLimitReached(pollId: string, ipHash: string | null) {
  if (!ipHash) return false;

  const votesFromIp = await db.vote.count({
    where: { pollId, ipAddress: ipHash },
  });

  return votesFromIp >= MAX_VOTES_PER_IP;
}

/** पोल पेज पर: इस आगंतुक को वोट फॉर्म दिखाना है या परिणाम? */
export async function hasAlreadyVoted(pollId: string) {
  const { ipHash, deviceId } = await getVoterIdentity();

  if (deviceId) {
    const vote = await db.vote.findUnique({
      where: { pollId_anonymousUserId: { pollId, anonymousUserId: deviceId } },
      select: { id: true },
    });
    if (vote) return true;
  }

  return isIpLimitReached(pollId, ipHash);
}