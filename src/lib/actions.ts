'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { db } from '@/lib/db';
import { isPollOpen } from '@/lib/poll-utils';
import { DEVICE_COOKIE, getVoterIdentity, isRepeatVote } from '@/lib/voter';

export type VoteResult =
  | { success: true }
  | {
      success: false;
      code: 'INVALID' | 'CLOSED' | 'ALREADY_VOTED' | 'ERROR';
      message: string;
    };

const ALREADY_VOTED_MESSAGE = 'आप इस पोल में पहले ही वोट दे चुके हैं।';

export async function castVote(
  pollId: string,
  optionId: string,
  deviceSigRaw?: string,
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

    // ब्राउज़र से आया डिवाइस-हस्ताक्षर (सिर्फ़ hex अक्षर मान्य)
    const deviceSig =
      deviceSigRaw && /^[a-f0-9]{16,64}$/.test(deviceSigRaw) ? deviceSigRaw : null;

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

    // 1. इसी ब्राउज़र (कुकी) ने इस पोल में पहले वोट दिया है?
    const existingVote = await db.vote.findUnique({
      where: { pollId_anonymousUserId: { pollId, anonymousUserId: deviceId } },
      select: { id: true },
    });

    if (existingVote) {
      return { success: false, code: 'ALREADY_VOTED', message: ALREADY_VOTED_MESSAGE };
    }

    // 2. दूसरे ब्राउज़र/इनकॉग्निटो से वही डिवाइस, वही नेटवर्क, हाल ही में?
    if (await isRepeatVote(pollId, ipHash, deviceSig)) {
      return { success: false, code: 'ALREADY_VOTED', message: ALREADY_VOTED_MESSAGE };
    }

    // 3. वोट सुरक्षित रूप से दर्ज करें
    await db.$transaction([
      db.vote.create({
        data: {
          pollId,
          optionId,
          anonymousUserId: deviceId,
          ipAddress: ipHash,
          deviceSig,
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
      return { success: false, code: 'ALREADY_VOTED', message: ALREADY_VOTED_MESSAGE };
    }

    console.error('castVote error:', error);
    return {
      success: false,
      code: 'ERROR',
      message: 'वोट दर्ज करते समय समस्या आई। कृपया दोबारा प्रयास करें।',
    };
  }
}