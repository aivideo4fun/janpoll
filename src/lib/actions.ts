'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { isPollOpen } from '@/lib/poll-utils';
import {
  DEVICE_COOKIE,
  MAX_VOTES_PER_IP,
  getVoterIdentity,
  hasAlreadyVoted,
} from '@/lib/voter';

export type VoteResult =
  | { success: true }
  | {
      success: false;
      code: 'INVALID' | 'CLOSED' | 'ALREADY_VOTED' | 'IP_LIMIT' | 'ERROR';
      message: string;
    };

export async function castVote(
  pollId: string,
  optionId: string,
): Promise<VoteResult> {
  try {
    const poll = await db.poll.findUnique({
      where: { id: pollId },
      select: {
        id: true,
        active: true,
        createdAt: true,
        deadlineDays: true,
        options: { where: { id: optionId }, select: { id: true } },
      },
    });

    if (!poll || poll.options.length === 0) {
      return { success: false, code: 'INVALID', message: 'अमान्य पोल या विकल्प।' };
    }

    if (!isPollOpen(poll)) {
      return { success: false, code: 'CLOSED', message: 'यह पोल बंद हो चुका है।' };
    }

    // इसी device से पहले वोट हो चुका है?
    if (await hasAlreadyVoted(pollId)) {
      return {
        success: false,
        code: 'ALREADY_VOTED',
        message: 'आप इस पोल में पहले ही वोट दे चुके हैं।',
      };
    }

    // एक IP से सीमित वोट (शेयर्ड WiFi / मोबाइल नेटवर्क के लिए छूट)
    const { ipHash } = await getVoterIdentity();

    if (ipHash) {
      const votesFromIp = await db.vote.count({
        where: { pollId, ipAddress: ipHash },
      });

      if (votesFromIp >= MAX_VOTES_PER_IP) {
        return {
          success: false,
          code: 'IP_LIMIT',
          message: 'इस नेटवर्क से वोट की सीमा पूरी हो चुकी है।',
        };
      }
    }

    // Device cookie server बनाएगा
    const cookieStore = await cookies();
    let deviceId = cookieStore.get(DEVICE_COOKIE)?.value;

    if (!deviceId) {
      deviceId = randomUUID();
      cookieStore.set(DEVICE_COOKIE, deviceId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
    }

    await db.$transaction([
      db.vote.create({
        data: {
          pollId,
          optionId,
          anonymousUserId: deviceId,
          ipAddress: ipHash,
        },
      }),
      db.pollOption.update({
        where: { id: optionId },
        data: { voteCount: { increment: 1 } },
      }),
    ]);

    revalidatePath('/');
    revalidatePath(`/poll/${pollId}`);

    return { success: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return {
        success: false,
        code: 'ALREADY_VOTED',
        message: 'आप इस पोल में पहले ही वोट दे चुके हैं।',
      };
    }

    console.error('castVote error:', error);
    return {
      success: false,
      code: 'ERROR',
      message: 'वोट दर्ज करते समय समस्या आई। कृपया दोबारा प्रयास करें।',
    };
  }
}