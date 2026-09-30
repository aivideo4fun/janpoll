'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { isPollOpen } from '@/lib/poll-utils';
import { DEVICE_COOKIE, getVoterIdentity, hasAlreadyVoted } from '@/lib/voter';

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

    if (await hasAlreadyVoted(pollId)) {
      return {
        success: false,
        code: 'ALREADY_VOTED',
        message: 'आप इस पोल में पहले ही वोट दे चुके हैं।',
      };
    }

    // Device cookie server बनाएगा, client नहीं (client का ID नकली हो सकता है)
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

    const { ipHash } = await getVoterIdentity();

    // Vote और count एक साथ सेव होंगे, या दोनों नहीं
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
    // Unique constraint: दो request एक साथ आईं तो भी दूसरा वोट रुकेगा
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