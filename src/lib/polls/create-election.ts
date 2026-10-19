import 'server-only';

import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { db } from '@/lib/db';
import { googleAuthOptions } from '@/lib/google-auth';
import { getRegionByCode } from '@/lib/regions';
import { generateSlug } from '@/lib/slugify';

export class ElectionCreateError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = 'ElectionCreateError';
  }
}

const optionalId = z.string().trim().min(1).max(100).nullable();

const inputSchema = z.object({
  stateCode: z.string().trim().min(1).max(10),
  electionType: z.enum(['sarpanch', 'samiti', 'zila']),
  districtId: z.string().trim().min(1).max(100),

  samitiId: optionalId,
  gramPanchayatId: optionalId,
  samitiWardId: optionalId,
  zilaWardId: optionalId,

  question: z.string().trim().min(5).max(500),
  options: z.array(
    z.string().trim().min(1).max(255),
  ).min(2).max(15),

  deadlineDays: z.number().int().min(1).max(60),
  requiresLogin: z.boolean(),
  termsAgreed: z.literal(true),
}).strict();

export async function createElectionPoll(raw: unknown) {
  const session = await getServerSession(googleAuthOptions);

  if (!session?.user?.email) {
    throw new ElectionCreateError(
      'पोल बनाने के लिए sign-in करें।',
      401,
    );
  }

  const parsed = inputSchema.safeParse(raw);

  if (!parsed.success) {
    throw new ElectionCreateError(
      'सवाल, विकल्प, क्षेत्र और नियमों की सहमति जाँचें।',
    );
  }

  const input = parsed.data;
  const region = getRegionByCode(input.stateCode);

  if (!region) {
    throw new ElectionCreateError('मान्य राज्य चुनें।');
  }

  const normalizedOptions = input.options.map((option) =>
    option.normalize('NFC').toLocaleLowerCase(),
  );

  if (
    new Set(normalizedOptions).size !==
    normalizedOptions.length
  ) {
    throw new ElectionCreateError(
      'एक जैसे विकल्प दोबारा न लिखें।',
    );
  }

  // नई form केवल इस schema के मौजूदा तीन election types संभालती है।
  if (
    input.electionType === 'zila' &&
    (
      input.samitiId ||
      input.gramPanchayatId ||
      input.samitiWardId
    )
  ) {
    throw new ElectionCreateError(
      'जिला परिषद poll में असंबंधित क्षेत्र न भेजें।',
    );
  }

  if (
    input.electionType === 'sarpanch' &&
    (input.samitiWardId || input.zilaWardId)
  ) {
    throw new ElectionCreateError('क्षेत्र चयन जाँचें।');
  }

  if (
    input.electionType === 'samiti' &&
    (input.gramPanchayatId || input.zilaWardId)
  ) {
    throw new ElectionCreateError('क्षेत्र चयन जाँचें।');
  }

  return db.$transaction(async (tx) => {
    const district = await tx.district.findFirst({
      where: {
        id: input.districtId,
        stateCode: region.code,
      },
    });

    if (!district) {
      throw new ElectionCreateError(
        'चुना जिला इस राज्य का नहीं है।',
      );
    }

    let samitiName: string | null = null;
    let gramPanchayatName: string | null = null;

    if (input.electionType !== 'zila') {
      if (!input.samitiId) {
        throw new ElectionCreateError(
          'पंचायत समिति चुनें।',
        );
      }

      const samiti = await tx.panchayatSamiti.findFirst({
        where: {
          id: input.samitiId,
          districtId: district.id,
        },
      });

      if (!samiti) {
        throw new ElectionCreateError(
          'पंचायत समिति चुने जिले की नहीं है।',
        );
      }

      samitiName = samiti.nameHi;

      if (input.electionType === 'sarpanch') {
        if (!input.gramPanchayatId) {
          throw new ElectionCreateError(
            'ग्राम पंचायत चुनें।',
          );
        }

        const gp = await tx.gramPanchayat.findFirst({
          where: {
            id: input.gramPanchayatId,
            districtId: district.id,
            samitiId: samiti.id,
          },
        });

        if (!gp) {
          throw new ElectionCreateError(
            'ग्राम पंचायत का क्षेत्र मेल नहीं खाता।',
          );
        }

        gramPanchayatName = gp.nameHi;
      } else {
        if (!input.samitiWardId) {
          throw new ElectionCreateError(
            'पंचायत समिति वार्ड चुनें।',
          );
        }

        const ward = await tx.samitiWard.findFirst({
          where: {
            id: input.samitiWardId,
            samitiId: samiti.id,
          },
          select: { id: true },
        });

        if (!ward) {
          throw new ElectionCreateError(
            'समिति वार्ड का क्षेत्र मेल नहीं खाता।',
          );
        }
      }
    } else {
      if (!input.zilaWardId) {
        throw new ElectionCreateError(
          'जिला परिषद वार्ड चुनें।',
        );
      }

      const ward = await tx.zilaParishadWard.findFirst({
        where: {
          id: input.zilaWardId,
          districtId: district.id,
        },
        select: { id: true },
      });

      if (!ward) {
        throw new ElectionCreateError(
          'जिला परिषद वार्ड इस जिले का नहीं है।',
        );
      }
    }

    const suffix = randomUUID();
    const base = generateSlug(input.question) || 'poll';

    const poll = await tx.poll.create({
      data: {
        question: input.question,

        // समान सवाल वाले polls पर slug collision से बचें।
        slug: `${base.slice(0, 450)}-${suffix}`,

        creatorName: session.user.name ?? null,
        creatorEmail: session.user.email,

        // Google login ≠ admin verification.
        isVerified: false,

        scope: 'STATE',
        stateCode: region.code,
        categoryType: 'political',
        electionType: input.electionType,
        requiresLogin: input.requiresLogin,

        active: true,
        deadlineDays: input.deadlineDays,

        districtId: district.id,
        districtName: district.nameHi,

        samitiId: input.samitiId,
        samitiName,

        gramPanchayatId: input.gramPanchayatId,
        gramPanchayatName,

        samitiWardId: input.samitiWardId,
        zilaWardId: input.zilaWardId,

        termsAgreed: true,
        termsVersion: '2026-10-18',
        termsAcceptedAt: new Date(),

        options: {
          create: input.options.map((text, order) => ({
            text,
            order,
            voteCount: 0,
          })),
        },
      },
      select: {
        id: true,
        stateCode: true,
      },
    });

    return poll;
  });
}