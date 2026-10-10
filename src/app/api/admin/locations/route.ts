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
  const wardId = searchParams.get('wardId');

  try {
    if (wardId) {
      const items = await db.village.findMany({
        where: { wardId },
        select: { id: true, nameHi: true, nameEn: true },
        orderBy: { nameHi: 'asc' },
      });
      return NextResponse.json({ items });
    }

    if (samitiId) {
      const items = await db.samitiWard.findMany({
        where: { samitiId },
        select: { id: true, wardNo: true, nameHi: true },
        orderBy: { wardNo: 'asc' },
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

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, districtId, samitiId, wardId, dataList } = body;

    let addedCount = 0;

    for (const item of dataList) {
      if (type === 'panchayatSamiti' && districtId) {
        await db.panchayatSamiti.upsert({
          where: { districtId_nameEn: { districtId, nameEn: item.nameEn } },
          update: { nameHi: item.nameHi || item.nameEn },
          create: { nameEn: item.nameEn, nameHi: item.nameHi || item.nameEn, districtId },
        });
        addedCount++;
      } else if (type === 'samitiWard' && samitiId) {
        await db.samitiWard.upsert({
          where: { samitiId_wardNo: { samitiId, wardNo: Number(item.wardNo) } },
          update: { nameHi: item.nameHi || `वार्ड ${item.wardNo}` },
          create: { wardNo: Number(item.wardNo), nameHi: item.nameHi || `वार्ड ${item.wardNo}`, samitiId },
        });
        addedCount++;
      } else if (type === 'village' && wardId) {
        await db.village.upsert({
          where: { wardId_nameEn: { wardId, nameEn: item.nameEn } },
          update: { nameHi: item.nameHi || item.nameEn },
          create: { nameEn: item.nameEn, nameHi: item.nameHi || item.nameEn, wardId },
        });
        addedCount++;
      }
    }

    return NextResponse.json({ success: true, message: `सफलतापूर्वक ${addedCount} रिकॉर्ड्स जोड़ दिए गए हैं!` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'त्रुटि हुई' }, { status: 500 });
  }
}