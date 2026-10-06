import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { normalizeName, safeDecode, sameName } from '@/lib/location';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gp = safeDecode(searchParams.get('gp') ?? '').trim();
    const samiti = safeDecode(searchParams.get('samiti') ?? '').trim();
    const district = safeDecode(searchParams.get('district') ?? '').trim();

    if (!gp) {
      return NextResponse.json({ pollId: null }, { status: 400 });
    }

    // पूरे table की जगह सिर्फ़ इसी गाँव के नाम वाले polls
    const candidates = await db.poll.findMany({
      where: {
        active: true,
        gramPanchayatName: { in: [gp, gp.normalize('NFC')] },
      },
      select: {
        id: true,
        slug: true,
        gramPanchayatName: true,
        samitiName: true,
        districtName: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const match = candidates.find(
      (p) =>
        normalizeName(p.gramPanchayatName) === normalizeName(gp) &&
        // पुराने polls में samiti/district खाली हो सकते हैं, उन्हें भी चलने दें
        (!samiti || !p.samitiName || sameName(p.samitiName, samiti)) &&
        (!district || !p.districtName || sameName(p.districtName, district)),
    );

    if (!match) {
      return NextResponse.json({ pollId: null });
    }

    return NextResponse.json({
      pollId: match.id,
      url: match.slug ? `/poll/${match.id}/${match.slug}` : `/poll/${match.id}`,
    });
  } catch (error) {
    console.error('Error checking poll existence:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}