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

// 🛠️ Naya POST method joda gaya hai bulk locations aur wards add karne ke liye
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, districtId, samitiId, dataList } = body;

    if (!type || !dataList || !Array.isArray(dataList)) {
      return NextResponse.json({ success: false, message: 'Invalid data format' }, { status: 400 });
    }

    let addedCount = 0;

    for (const item of dataList) {
      if (type === 'gramPanchayat' && districtId && samitiId) {
        await db.gramPanchayat.upsert({
          where: { samitiId_nameEn: { samitiId, nameEn: item.nameEn } },
          update: { nameHi: item.nameHi || item.nameEn },
          create: {
            nameEn: item.nameEn,
            nameHi: item.nameHi || item.nameEn,
            districtId,
            samitiId,
          },
        });
        addedCount++;
      } else if (type === 'zilaWard' && districtId) {
        await db.zilaParishadWard.upsert({
          where: { districtId_wardNo: { districtId, wardNo: Number(item.wardNo) } },
          update: { nameHi: item.nameHi || `वार्ड ${item.wardNo}` },
          create: {
            wardNo: Number(item.wardNo),
            nameHi: item.nameHi || `वार्ड ${item.wardNo}`,
            districtId,
          },
        });
        addedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Safaltaपूर्वक ${addedCount} records database mein update/add kar diye gaye hain!`,
    });
  } catch (error: any) {
    console.error('Location upload error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}