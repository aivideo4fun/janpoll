import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get('districtId');
  const tehsilId = searchParams.get('tehsilId');
  const samitiId = searchParams.get('samitiId');
  const wardId = searchParams.get('wardId');
  const type = searchParams.get('type');

  try {
    // 1. जिले के अंतर्गत तहसीलें
    if (type === 'tehsil' && districtId) {
      const items = await db.tehsil.findMany({
        where: { districtId },
        select: { id: true, nameHi: true, nameEn: true },
        orderBy: { nameHi: 'asc' },
      });
      return NextResponse.json({ items });
    }

    // 2. जिले के अंतर्गत पंचायत समितियाँ
    if (type === 'samiti' && districtId) {
      const items = await db.panchayatSamiti.findMany({
        where: { districtId },
        select: { id: true, nameHi: true, nameEn: true, tehsilId: true },
        orderBy: { nameHi: 'asc' },
      });
      return NextResponse.json({ items });
    }

    // 3. तहसील के अंतर्गत पंचायत समितियाँ (यदि तहसील के आधार पर filtrar karna ho)
    if (type === 'samitiByTehsil' && tehsilId) {
      const items = await db.panchayatSamiti.findMany({
        where: { tehsilId },
        select: { id: true, nameHi: true, nameEn: true },
        orderBy: { nameHi: 'asc' },
      });
      return NextResponse.json({ items });
    }

    // 4. पंचायत समिति के अंतर्गत ग्राम पंचायतें (सरपंच चुनाव के लिए)
    if (type === 'gp' && samitiId) {
      const items = await db.gramPanchayat.findMany({
        where: { samitiId },
        select: { id: true, nameHi: true, nameEn: true },
        orderBy: { nameHi: 'asc' },
      });
      return NextResponse.json({ items });
    }

    // 5. पंचायत समिति के अंतर्गत वार्ड (समिति वार्ड चुनाव के लिए)
    if (type === 'samitiWard' && samitiId) {
      const items = await db.samitiWard.findMany({
        where: { samitiId },
        select: { id: true, wardNo: true, nameHi: true },
        orderBy: { wardNo: 'asc' },
      });
      return NextResponse.json({ items });
    }

    // 6. समिति वार्ड के अंतर्गत गाँव (ब्रैकेट में नाम/वार्ड दिखाने के लिए)
    if (type === 'village' && wardId) {
      const items = await db.village.findMany({
        where: { wardId },
        select: { id: true, nameHi: true, nameEn: true },
        orderBy: { nameHi: 'asc' },
      });
      return NextResponse.json({ items });
    }

    // 7. जिला परिषद वार्ड (जिला चुनाव के लिए)
    if (type === 'zilaWard' && districtId) {
      const items = await db.zilaParishadWard.findMany({
        where: { districtId },
        select: { id: true, wardNo: true, nameHi: true },
        orderBy: { wardNo: 'asc' },
      });
      return NextResponse.json({ items });
    }

    // Default: केवल जिले लोड करने के लिए
    const items = await db.district.findMany({
      select: { id: true, nameHi: true, nameEn: true },
      orderBy: { nameHi: 'asc' },
    });
    return NextResponse.json({ items });

  } catch (error) {
    console.error('लोकेशन लोड करने में त्रुटि:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}