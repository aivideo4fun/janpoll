import 'server-only';
import { createHash } from 'crypto';
import { cookies, headers } from 'next/headers';
import { db } from '@/lib/db';

export const DEVICE_COOKIE = 'jp_device';

// IP limit ko thoda bada rakha hai taaki naya traffic ya ek hi network se log aaram se vote de sakein
export const MAX_VOTES_PER_IP = 100;

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

/** Kya is vishesh poll mein is network (IP) ki vote-सीमा poori ho chuki hai? */
export async function isIpLimitReached(pollId: string, ipHash: string | null) {
  if (!ipHash) return false;

  const votesFromIp = await db.vote.count({
    where: { pollId, ipAddress: ipHash },
  });

  return votesFromIp >= MAX_VOTES_PER_IP;
}

/** Kewal usi vishisht poll ke liye jaanch karein ki is user/device ne vote diya hai ya nahi */
export async function hasAlreadyVoted(pollId: string) {
  const { ipHash, deviceId } = await getVoterIdentity();

  // 1. Device ID check
  if (deviceId) {
    const vote = await db.vote.findUnique({
      where: {
        pollId_anonymousUserId: {
          pollId,
          anonymousUserId: deviceId,
        },
      },
      select: { id: true },
    });
    if (vote) return true;
  }

  // 2. IP limit check
  return isIpLimitReached(pollId, ipHash);
}