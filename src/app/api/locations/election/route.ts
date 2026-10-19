import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRegionByCode } from '@/lib/regions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const stateCode = params.get('stateCode') ?? '';
  const kind = params.get('kind') ?? 'district';
  const districtId = params.get('districtId');
  const samitiId = params.get('samitiId');

  if (!getRegionByCode(stateCode)) {
    return NextResponse.json(
      { message: 'मान्य राज्य चुनें।' },
      { status: 400 },
    );
  }

  if (
    !['district', 'samiti', 'gp', 'samitiWard', 'zilaWard']
      .includes(kind)
  ) {
    return NextResponse.json(
      { message: 'मान्य location type चुनें।' },
      { status: 400 },
    );
  }

  try {
    if (kind === 'district') {
      const items = await db.district.findMany({
        where: stateCode === 'RJ' ? { OR: [{ stateCode: 'RJ' }, { stateCode: null }] } : { stateCode },
        select: {
          id: true,
          nameHi: true,
          nameEn: true,
        },
        orderBy: { nameHi: 'asc' },
      });

      return NextResponse.json({ items });
    }

    if (!districtId) {
      return NextResponse.json(
        { message: 'जिला आवश्यक है।' },
        { status: 400 },
      );
    }

    const district = await db.district.findFirst({
      where: {
        id: districtId,
        ...(stateCode === 'RJ' ? { OR: [{ stateCode: 'RJ' }, { stateCode: null }] } : { stateCode }),
      },
      select: { id: true },
    });

    if (!district) {
      return NextResponse.json(
        { message: 'यह जिला चुने राज्य में नहीं है।' },
        { status: 400 },
      );
    }

    if (kind === 'samiti') {
      const items = await db.panchayatSamiti.findMany({
        where: { districtId },
        select: {
          id: true,
          nameHi: true,
          nameEn: true,
        },
        orderBy: { nameHi: 'asc' },
      });

      return NextResponse.json({ items });
    }

    if (kind === 'zilaWard') {
      const items = await db.zilaParishadWard.findMany({
        where: { districtId },
        select: {
          id: true,
          wardNo: true,
          nameHi: true,
        },
        orderBy: { wardNo: 'asc' },
      });

      return NextResponse.json({ items });
    }

    if (!samitiId) {
      return NextResponse.json(
        { message: 'पंचायत समिति आवश्यक है।' },
        { status: 400 },
      );
    }

    const samiti = await db.panchayatSamiti.findFirst({
      where: {
        id: samitiId,
        districtId,
      },
      select: { id: true },
    });

    if (!samiti) {
      return NextResponse.json(
        { message: 'पंचायत समिति और जिला मेल नहीं खाते।' },
        { status: 400 },
      );
    }

    if (kind === 'gp') {
      const items = await db.gramPanchayat.findMany({
        where: {
          districtId,
          samitiId,
        },
        select: {
          id: true,
          nameHi: true,
          nameEn: true,
        },
        orderBy: { nameHi: 'asc' },
      });

      return NextResponse.json({ items });
    }

    const items = await db.samitiWard.findMany({
      where: { samitiId },
      select: {
        id: true,
        wardNo: true,
        nameHi: true,
      },
      orderBy: { wardNo: 'asc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Election locations failed', error);

    return NextResponse.json(
      { message: 'क्षेत्रों की सूची लोड नहीं हो सकी।' },
      { status: 500 },
    );
  }
}