import { randomUUID, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { creatorIdentity } from '@/lib/polls/owner';
import { z } from 'zod';

import { db } from '@/lib/db';
import { creationGuard } from '@/lib/creation-guard';
import { generateSlug } from '@/lib/slugify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const optionalId = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .nullable()
  .optional();

const schema = z.object({
  question: z.string().trim().min(5).max(500),
  options: z
    .array(z.string().trim().min(1).max(255))
    .min(2)
    .max(15),

  electionType: z.enum(['sarpanch', 'samiti', 'zila']),
  districtId: z.string().trim().min(1).max(100),

  samitiId: optionalId,
  gramPanchayatId: optionalId,
  samitiWardId: optionalId,
  zilaWardId: optionalId,

  deadlineDays: z.number().int().min(1).max(60),
  requiresLogin: z.boolean(),
  termsAgreed: z.literal(true),
}).strict();

class InputError extends Error {}

export async function POST(request: Request) {
  try {
    const allowedOrigin = new URL(
      process.env.NEXTAUTH_URL || request.url,
    ).origin;

    if (request.headers.get('origin') !== allowedOrigin) {
      return NextResponse.json(
        { message: 'Request origin मान्य नहीं है।' },
        { status: 403 },
      );
    }

    const creator = await creatorIdentity(true);

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request format सही नहीं है।' },
        { status: 400 },
      );
    }

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            'सवाल, विकल्प, स्थान, अवधि और Terms acceptance जाँचें।',
        },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const normalizedOptions = input.options.map((text) =>
      text.normalize('NFC').toLocaleLowerCase(),
    );

    if (
      new Set(normalizedOptions).size !==
      normalizedOptions.length
    ) {
      throw new InputError('एक जैसे विकल्प दोबारा न लिखें।');
    }

    // दूसरे राज्य का जिला इस endpoint से स्वीकार नहीं होगा।
    const district = await db.district.findFirst({
      where: {
        id: input.districtId,
        OR: [{ stateCode: 'RJ' }, { stateCode: null }],
      },
      select: {
        id: true,
        nameHi: true,
      },
    });

    if (!district) {
      throw new InputError(
        'राजस्थान का मान्य जिला चुनें। यदि पुराना जिला नहीं दिख रहा है, उसकी state mapping जाँचनी होगी।',
      );
    }

    let samitiId: string | null = null;
    let samitiName: string | null = null;
    let gramPanchayatId: string | null = null;
    let gramPanchayatName: string | null = null;
    let samitiWardId: string | null = null;
    let zilaWardId: string | null = null;

    if (input.electionType === 'zila') {
      if (
        input.samitiId ||
        input.gramPanchayatId ||
        input.samitiWardId
      ) {
        throw new InputError(
          'जिला परिषद पोल में पंचायत समिति या ग्राम पंचायत न भेजें।',
        );
      }

      if (!input.zilaWardId) {
        throw new InputError('जिला परिषद वार्ड चुनें।');
      }

      const ward = await db.zilaParishadWard.findFirst({
        where: {
          id: input.zilaWardId,
          districtId: district.id,
        },
        select: { id: true },
      });

      if (!ward) {
        throw new InputError(
          'जिला परिषद वार्ड चुने हुए जिले में नहीं है।',
        );
      }

      zilaWardId = ward.id;
    } else {
      if (input.zilaWardId) {
        throw new InputError(
          'इस पोल में जिला परिषद वार्ड न भेजें।',
        );
      }

      if (!input.samitiId) {
        throw new InputError('पंचायत समिति चुनें।');
      }

      const samiti = await db.panchayatSamiti.findFirst({
        where: {
          id: input.samitiId,
          districtId: district.id,
        },
        select: {
          id: true,
          nameHi: true,
        },
      });

      if (!samiti) {
        throw new InputError(
          'पंचायत समिति चुने हुए जिले में नहीं है।',
        );
      }

      samitiId = samiti.id;
      samitiName = samiti.nameHi;

      if (input.electionType === 'sarpanch') {
        if (input.samitiWardId) {
          throw new InputError(
            'सरपंच पोल में समिति वार्ड न भेजें।',
          );
        }

        if (!input.gramPanchayatId) {
          throw new InputError('ग्राम पंचायत चुनें।');
        }

        const gp = await db.gramPanchayat.findFirst({
          where: {
            id: input.gramPanchayatId,
            districtId: district.id,
            samitiId: samiti.id,
          },
          select: {
            id: true,
            nameHi: true,
          },
        });

        if (!gp) {
          throw new InputError(
            'ग्राम पंचायत चुनी हुई समिति में नहीं है।',
          );
        }

        gramPanchayatId = gp.id;
        gramPanchayatName = gp.nameHi;
      } else {
        if (input.gramPanchayatId) {
          throw new InputError(
            'समिति वार्ड पोल में ग्राम पंचायत न भेजें।',
          );
        }

        if (!input.samitiWardId) {
          throw new InputError('पंचायत समिति वार्ड चुनें।');
        }

        const ward = await db.samitiWard.findFirst({
          where: {
            id: input.samitiWardId,
            samitiId: samiti.id,
          },
          select: { id: true },
        });

        if (!ward) {
          throw new InputError(
            'वार्ड चुनी हुई पंचायत समिति में नहीं है।',
          );
        }

        samitiWardId = ward.id;
      }
    }

    const limited = await creationGuard(creator);
    if (limited) return NextResponse.json({ message: limited }, { status: 429 });
    const slugBase = generateSlug(input.question) || 'poll';

    const poll = await db.poll.create({
      data: {
        question: input.question,
          creatorReference: `JP-${randomBytes(10).toString("hex").toUpperCase()}`,
        slug: `${slugBase.slice(0, 450)}-${randomUUID()}`,

        // पहचान browser के payload से नहीं ली जाएगी।
        creatorName: creator.name,
        creatorEmail: creator.email,
        creatorGuestHash: creator.guestHash,

        scope: 'STATE',
        stateCode: 'RJ',
        categoryType: 'political',
        topic: 'political',
        electionType: input.electionType,

        districtId: district.id,
        districtName: district.nameHi,
        samitiId,
        samitiName,
        gramPanchayatId,
        gramPanchayatName,
        samitiWardId,
        zilaWardId,

        deadlineDays: input.deadlineDays,
        requiresLogin: input.requiresLogin,
        active: true,

        // Verified badge केवल admin approval के बाद।
        isVerified: false,

        termsAgreed: true,
        termsVersion: '2026-10-19',
        termsAcceptedAt: new Date(),

        options: {
          create: input.options.map((text, order) => ({
            text,
            order,
            voteCount: 0,
          })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json(
      { pollId: poll.id },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 },
      );
    }

    console.error('Rajasthan poll creation failed', error);

    return NextResponse.json(
      { message: 'पोल प्रकाशित नहीं हो सका। दोबारा प्रयास करें।' },
      { status: 500 },
    );
  }
}