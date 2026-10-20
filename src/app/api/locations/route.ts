import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get('districtId');
  const samitiId = searchParams.get('samitiId');
  const wardId = searchParams.get('wardId');

  try {
    // 1. Agar wardId di hai, toh us ward ke gaon laayein
    if (wardId) {
      const items = await db.village.findMany({
        where: { wardId },
        select: { id: true, nameHi: true, nameEn: true },
        orderBy: { nameHi: 'asc' },
      });
      return NextResponse.json({ items });
    }

    // 2. Agar samitiId di hai, toh us panchayat samiti ki gram panchayatein laayein
    if (samitiId) {
      let items = await db.gramPanchayat.findMany({
        where: { samitiId },
        select: { id: true, nameHi: true, nameEn: true },
        orderBy: { nameHi: 'asc' },
      });

      return NextResponse.json({ items });
    }

    // 3. Agar districtId di hai, toh panchayat samitiyan laayein
    if (districtId) {
      const items = await db.panchayatSamiti.findMany({
        where: { districtId },
        select: { id: true, nameHi: true, nameEn: true },
        orderBy: { nameHi: 'asc' },
      });
      return NextResponse.json({ items });
    }

    // 4. Default: Sabhi districts laayein
    const items = await db.district.findMany({
      select: { id: true, nameHi: true, nameEn: true },
      orderBy: { nameHi: 'asc' },
    });
    return NextResponse.json({ items });

  } catch (error) {
    console.error('Location API Error:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}