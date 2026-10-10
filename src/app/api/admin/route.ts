import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get('districtId');
  const samitiId = searchParams.get('samitiId');

  try {
    if (samitiId) {
      const items = await db.gramPanchayat.findMany({
        where: { samitiId },
        select: { id: true, nameHi: true, nameEn: true },
        orderBy: { nameHi: 'asc' },
      });
      return NextResponse.json({ items });
    }

    if (districtId) {
      const items = await db.panchayatSamiti.findMany({
        where: { districtId },
        select: { id: true, nameHi: true, nameEn: true },
        orderBy: { nameHi: 'asc' },
      });
      return NextResponse.json({ items });
    }
  } catch (error) {
    console.error('स्थान सूची लोड त्रुटि:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }

  return NextResponse.json({ items: [] });
}