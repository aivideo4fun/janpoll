import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const cacheHeaders = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const districtId = (searchParams.get('districtId') ?? '').slice(0, 64);
  const samitiId = (searchParams.get('samitiId') ?? '').slice(0, 64);

  try {
    if (samitiId) {
      const items = await db.gramPanchayat.findMany({
        where: { samitiId },
        select: { id: true, nameHi: true },
        orderBy: { nameHi: 'asc' },
      });
      return NextResponse.json({ items }, { headers: cacheHeaders });
    }

    if (districtId) {
      const items = await db.panchayatSamiti.findMany({
        where: { districtId },
        select: { id: true, nameHi: true },
        orderBy: { nameHi: 'asc' },
      });
      return NextResponse.json({ items }, { headers: cacheHeaders });
    }

    const items = await db.district.findMany({
      select: { id: true, nameHi: true },
      orderBy: { nameHi: 'asc' },
    });
    return NextResponse.json({ items }, { headers: cacheHeaders });
  } catch (error) {
    console.error('स्थान सूची लोड त्रुटि:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
