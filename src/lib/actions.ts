'use server';

import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { db } from '@/lib/db';
import { googleAuthOptions } from '@/lib/google-auth';
import { isPollOpen } from '@/lib/poll-utils';
import {
  DEVICE_COOKIE,
  DUPLICATE_WINDOW_HOURS,
  getVoterIdentity,
} from '@/lib/voter';

export type VoteResult =
  | { success: true }
  | {
      success: false;
      code:
        | 'INVALID'
        | 'CLOSED'
        | 'AUTH_REQUIRED'
        | 'ALREADY_VOTED'
        | 'ERROR';
      message: string;
    };

const repeatResult: VoteResult = {
  success: false,
  code: 'ALREADY_VOTED',
  message: 'आप इस पोल में पहले ही वोट दे चुके हैं।',
};

export async function castVote(
  pollId: string,
  optionId: string,
  deviceSigRaw?: string,
): Promise<VoteResult> {
  try {
    if (
      typeof pollId !== 'string' ||
      typeof optionId !== 'string' ||
      !pollId ||
      !optionId ||
      pollId.length > 100 ||
      optionId.length > 100
    ) {
      return {
        success: false,
        code: 'INVALID',
        message: 'अमान्य पोल या विकल्प।',
      };
    }

    const session = await getServerSession(googleAuthOptions);

    // Database user की पहचान server session से लें।
    // Client से भेजी गई user ID स्वीकार नहीं की जाती।
    const email = session?.user?.email;

    const user = email
      ? await db.user.findUnique({
          where: { email },
          select: { id: true },
        })
      : null;

    const identity = await getVoterIdentity();
    const cookieStore = await cookies();

    const deviceId = identity.deviceId || randomUUID();

    if (!identity.deviceId) {
      cookieStore.set(DEVICE_COOKIE, deviceId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
    }

    const deviceSig =
      typeof deviceSigRaw === 'string' &&
      /^[a-f0-9]{16,64}$/.test(deviceSigRaw)
        ? deviceSigRaw
        : null;

    const result = await db.$transaction(
      async (tx): Promise<VoteResult> => {
        // इसी poll पर आने वाले voting requests को क्रम में चलाएँ।
        await tx.$queryRaw`
          SELECT "id"
          FROM "Poll"
          WHERE "id" = ${pollId}
          FOR UPDATE
        `;

        const poll = await tx.poll.findUnique({
          where: { id: pollId },
          select: {
            id: true,
            active: true,
            createdAt: true,
            deadlineDays: true,
            requiresLogin: true,
            options: {
              where: { id: optionId },
              select: { id: true },
            },
          },
        });

        if (!poll || poll.options.length !== 1) {
          return {
            success: false,
            code: 'INVALID',
            message: 'अमान्य पोल या विकल्प।',
          };
        }

        if (!isPollOpen(poll)) {
          return {
            success: false,
            code: 'CLOSED',
            message: 'यह पोल बंद हो चुका है।',
          };
        }

        if (poll.requiresLogin && !user) {
          return {
            success: false,
            code: 'AUTH_REQUIRED',
            message: 'इस पोल में वोट देने के लिए sign-in करें।',
          };
        }

        const previousVote = await tx.vote.findFirst({
          where: {
            pollId,
            OR: [
              { anonymousUserId: deviceId },
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

        if (previousVote) return repeatResult;

        // Guest voting के लिए पुराना network/device check।
        // इसे account verification का विकल्प न मानें।
        if (
          !poll.requiresLogin &&
          identity.ipHash &&
          deviceSig
        ) {
          const since = new Date(
            Date.now() -
              DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000,
          );

          const repeatedDevice = await tx.vote.findFirst({
            where: {
              pollId,
              ipAddress: identity.ipHash,
              deviceSig,
              createdAt: { gte: since },
            },
            select: { id: true },
          });

          if (repeatedDevice) return repeatResult;
        }

        await tx.vote.create({
          data: {
            pollId,
            optionId,
            anonymousUserId:
              poll.requiresLogin && user
                ? `user:${user.id}`
                : deviceId,
            userId: user?.id ?? null,
            ipAddress: identity.ipHash,
            deviceSig,
          },
        });

        await tx.pollOption.update({
          where: { id: optionId },
          data: {
            voteCount: { increment: 1 },
          },
        });

        return { success: true };
      },
      {
        maxWait: 10000,
        timeout: 15000,
      },
    );

    if (result.success) {
      // Vote commit होने के बाद cache failure को voting
      // failure के रूप में न दिखाएँ।
      try {
        revalidatePath('/');
        revalidatePath('/rajasthan', 'layout');
        revalidatePath('/state/[slug]', 'page');
        revalidatePath(`/poll/${pollId}`, 'layout');
      } catch (error) {
        console.error('Vote cache refresh failed', error);
      }
    }

    return result;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return repeatResult;
    }

    console.error('castVote failed', error);

    return {
      success: false,
      code: 'ERROR',
      message:
        'वोट दर्ज करते समय समस्या आई। कृपया दोबारा प्रयास करें।',
    };
  }
}