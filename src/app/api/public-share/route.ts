import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const expectedOrigin = new URL(
      process.env.NEXTAUTH_URL || request.url,
    ).origin;

    if (request.headers.get('origin') !== expectedOrigin) {
      return NextResponse.json(
        { message: 'Request origin मान्य नहीं है।' },
        { status: 403 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request format सही नहीं है।' },
        { status: 400 },
      );
    }

    const pollId =
      typeof body === 'object' &&
      body !== null &&
      'pollId' in body &&
      typeof body.pollId === 'string'
        ? body.pollId
        : '';

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        .test(pollId)
    ) {
      return NextResponse.json(
        { message: 'मान्य poll चुनें।' },
        { status: 400 },
      );
    }

    // Private poll creation remains disabled in the current schema.
    const poll = await db.poll.findUnique({
      where: { id: pollId },
      select: { id: true, shareCode: true },
    });

    if (!poll) {
      return NextResponse.json(
        { message: 'पोल उपलब्ध नहीं है।' },
        { status: 404 },
      );
    }

    if (poll.shareCode) {
      return NextResponse.json(
        { sharePath: `/s/${poll.shareCode}` },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = randomBytes(6).toString('base64url');

      try {
        // Only one concurrent request can assign the initial code.
        await db.poll.updateMany({
          where: {
            id: pollId,
            shareCode: null,
          },
          data: { shareCode: code },
        });

        const saved = await db.poll.findUnique({
          where: { id: pollId },
          select: { shareCode: true },
        });

        if (saved?.shareCode) {
          return NextResponse.json(
            { sharePath: `/s/${saved.shareCode}` },
            { headers: { 'Cache-Control': 'no-store' } },
          );
        }

        return NextResponse.json(
          { message: 'पोल उपलब्ध नहीं है।' },
          { status: 404 },
        );
      } catch (error) {
        const collision =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2002';

        if (!collision) throw error;
      }
    }

    return NextResponse.json(
      { message: 'Share link तैयार नहीं हुआ। दोबारा कोशिश करें।' },
      { status: 503 },
    );
  } catch (error) {
    console.error('Public share link failed', error);

    return NextResponse.json(
      { message: 'Share link तैयार नहीं हो सका।' },
      { status: 500 },
    );
  }
}