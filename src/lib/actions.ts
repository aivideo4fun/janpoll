'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { db } from '@/lib/db';
import { isPollOpen } from '@/lib/poll-utils';
import { DEVICE_COOKIE, getVoterIdentity, isIpLimitReached } from '@/lib/voter';

export type VoteResult =
  | { success: true }
  | {
      success: false;
      code: 'INVALID' | 'CLOSED' | 'ALREADY_VOTED' | 'ERROR';
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

    const { ipHash, deviceId: existingDeviceId } = await getVoterIdentity();

    const cookieStore = await cookies();
    let deviceId = existingDeviceId;

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

    // 1. जांचें कि क्या इस विशिष्ट (Current) पोल पर इस डिवाइस ने पहले वोट दिया है
    const existingVote = await db.vote.findUnique({
      where: {
        pollId_anonymousUserId: {
          pollId,
          anonymousUserId: deviceId,
        },
      },
    });

    if (existingVote) {
      return {
        success: false,
        code: 'ALREADY_VOTED',
        message: 'आप इस पोल में पहले ही वोट दे चुके हैं।',
      };
    }

    // 2. इसी नेटवर्क (IP) से इस विशिष्ट पोल पर सीमा चेक
    if (await isIpLimitReached(pollId, ipHash)) {
      return {
        success: false,
        code: 'ALREADY_VOTED',
        message: 'इस नेटवर्क से इस पोल में वोट की सीमा पूरी हो चुकी है।',
      };
    }

    // 3. सुरक्षित रूप से वोट दर्ज करें
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
  } catch (error: any) {
    if (error?.code === 'P2002') {
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