import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { db } from '@/lib/db';
import { googleAuthOptions } from '@/lib/google-auth';
import { getRegionByCode } from '@/lib/regions';
import { generateSlug } from '@/lib/slugify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSchema = z.object({
  stateCode: z.string().trim().min(1).max(10),
  question: z.string().trim().min(5).max(500),
  options: z.array(z.string().trim().min(1).max(255)).min(2).max(15),
  deadlineDays: z.number().int().min(1).max(60),
  requiresLogin: z.boolean(),
  termsAgreed: z.literal(true),
  requestId: z.string().uuid(),
}).strict();

type SavedPoll = {
  creatorEmail: string | null;
  question: string;
  scope: string;
  stateCode: string | null;
  districtId: string | null;
  electionType: string | null;
  topic: string | null;
  deadlineDays: number;
  requiresLogin: boolean;
  options: { text: string }[];
};

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const stateCode = (query.get('stateCode') ?? '').trim().toUpperCase();

  const region = getRegionByCode(stateCode);

  if (!region) {
    return NextResponse.json(
      { message: 'मान्य राज्य चुनें।' },
      { status: 400 },
    );
  }

  try {
    const where = {
      active: true,
      scope: 'STATE' as const,
      stateCode: region.code,
    };

    const [count, polls] = await db.$transaction([
      db.poll.count({ where }),

      db.poll.findMany({
        where,
        orderBy: [
          { createdAt: 'desc' },
          { id: 'asc' },
        ],
        take: 12,
        select: {
          id: true,
          question: true,
          createdAt: true,
          deadlineDays: true,
          options: {
            select: {
              id: true,
              text: true,
              voteCount: true,
            },
            orderBy: [
              { order: 'asc' },
              { createdAt: 'asc' },
            ],
          },
        },
      }),
    ]);

    return NextResponse.json(
      { count, polls },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('State polls fetch failed', error);

    return NextResponse.json(
      { message: 'पोल उपलब्ध नहीं हो सके।' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const configuredOrigin = new URL(
      process.env.NEXTAUTH_URL || request.url,
    ).origin;

    if (request.headers.get('origin') !== configuredOrigin) {
      return NextResponse.json(
        { message: 'Request origin मान्य नहीं है।' },
        { status: 403 },
      );
    }

    const session = await getServerSession(googleAuthOptions);
    const creatorEmail = session?.user?.email;

    if (!creatorEmail) {
      return NextResponse.json(
        { message: 'पोल बनाने के लिए login करें।' },
        { status: 401 },
      );
    }

    let raw: unknown;

    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request format सही नहीं है।' },
        { status: 400 },
      );
    }

    const parsed = createSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'राज्य, सवाल, विकल्प और terms acceptance जाँचें।' },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const region = getRegionByCode(
      input.stateCode.toUpperCase(),
    );

    if (!region) {
      return NextResponse.json(
        { message: 'मान्य राज्य चुनें।' },
        { status: 400 },
      );
    }

    const normalized = input.options.map((option) =>
      option.normalize('NFC').toLocaleLowerCase(),
    );

    if (new Set(normalized).size !== normalized.length) {
      return NextResponse.json(
        { message: 'एक जैसे विकल्प दोबारा न लिखें।' },
        { status: 400 },
      );
    }

    const sameRequest = (poll: SavedPoll) =>
      poll.creatorEmail === creatorEmail &&
      poll.question === input.question &&
      poll.scope === 'STATE' &&
      poll.stateCode === region.code &&
      poll.districtId === null &&
      poll.electionType === null &&
      poll.topic === 'others' &&
      poll.deadlineDays === input.deadlineDays &&
      poll.requiresLogin === input.requiresLogin &&
      JSON.stringify(poll.options.map((option) => option.text)) ===
        JSON.stringify(input.options);

    const existing = await db.poll.findUnique({
      where: { id: input.requestId },
      include: {
        options: {
          orderBy: [
            { order: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (existing) {
      if (!sameRequest(existing)) {
        return NextResponse.json(
          { message: 'Submission की जानकारी बदल गई है। नया submission करें।' },
          { status: 409 },
        );
      }

      return NextResponse.json({
        pollId: existing.id,
        scope: existing.scope,
        stateCode: existing.stateCode,
      });
    }

    try {
      const base = generateSlug(input.question) || 'poll';

      const poll = await db.poll.create({
        data: {
          id: input.requestId,
          question: input.question,
          slug: `${base.slice(0, 450)}-${randomUUID()}`,

          creatorName: null,
          creatorEmail,

          scope: 'STATE',
          stateCode: region.code,

          // Legacy fields retained internally for compatibility.
          categoryType: 'non-political',
          topic: 'others',
          electionType: null,

          districtId: null,
          districtName: null,
          samitiId: null,
          samitiName: null,
          gramPanchayatId: null,
          gramPanchayatName: null,
          samitiWardId: null,
          zilaWardId: null,
          assemblyId: null,

          active: true,
          isVerified: false,
          deadlineDays: input.deadlineDays,
          requiresLogin: input.requiresLogin,

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
          scope: true,
          stateCode: true,
        },
      });

      return NextResponse.json(
        {
          pollId: poll.id,
          scope: poll.scope,
          stateCode: poll.stateCode,
        },
        { status: 201 },
      );
    } catch (error) {
      const duplicate =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002';

      if (duplicate) {
        const saved = await db.poll.findUnique({
          where: { id: input.requestId },
          include: {
            options: {
              orderBy: [
                { order: 'asc' },
                { createdAt: 'asc' },
              ],
            },
          },
        });

        if (saved && sameRequest(saved)) {
          return NextResponse.json({
            pollId: saved.id,
            scope: saved.scope,
            stateCode: saved.stateCode,
          });
        }
      }

      throw error;
    }
  } catch (error) {
    console.error('Public poll creation failed', error);

    return NextResponse.json(
      {
        message:
          'पोल प्रकाशित नहीं हो सका। अपनी entries रखें और दोबारा कोशिश करें।',
      },
      { status: 500 },
    );
  }
}