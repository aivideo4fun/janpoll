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

  // IPv6: पूरा /64 block एक ही user माना जाए, वरना IP बदलकर bypass हो सकता है
  if (raw.includes(':')) {
    return raw.split(':').slice(0, 4).join(':');
  }
  return raw;
}

function hashIp(ip: string) {
  const salt = process.env.VOTE_SALT ?? 'janpoll-default-salt';
  // 32 hex chars = ipAddress VarChar(45) में fit
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

export async function getVoterIdentity() {
  const ip = await getClientIp();
  const cookieStore = await cookies();

  return {
    ipHash: ip ? hashIp(ip) : null,
    deviceId: cookieStore.get(DEVICE_COOKIE)?.value ?? null,
  };
}

export async function hasAlreadyVoted(pollId: string) {
  const { ipHash, deviceId } = await getVoterIdentity();

  const conditions = [
    ...(ipHash ? [{ ipAddress: ipHash }] : []),
    ...(deviceId ? [{ anonymousUserId: deviceId }] : []),
  ];

  if (conditions.length === 0) return false;

  const vote = await db.vote.findFirst({
    where: { pollId, OR: conditions },
    select: { id: true },
  });

  return Boolean(vote);
}