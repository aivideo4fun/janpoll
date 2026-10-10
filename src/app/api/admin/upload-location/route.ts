import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const type = formData.get('type') as string; // 'gramPanchayat' | 'zilaWard' | 'panchayatSamiti'
    const districtId = formData.get('districtId') as string;
    const samitiId = formData.get('samitiId') as string;
    const dataList = JSON.parse(formData.get('dataList') as string || '[]');

    if (!type || dataList.length === 0) {
      return NextResponse.json({ success: false, message: 'डेटा या प्रकार (Type) सही नहीं है।' }, { status: 400 });
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

    return NextResponse.json({ success: true, message: `सफलतापूर्वक ${addedCount} रिकॉर्ड्स अपडेट/जोड़ दिए गए हैं!` });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'अपलोड करते समय त्रुटि आई।' }, { status: 500 });
  }
}