import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { getRegionByCode } from '@/lib/regions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const stateCode = (params.get('stateCode') ?? '').toUpperCase();
  const districtId = params.get('districtId') ?? '';

  if (!getRegionByCode(stateCode) || !districtId) {
    return NextResponse.json(
      { message: 'मान्य राज्य और जिला चुनें।' },
      { status: 400 },
    );
  }

  try {
    const district = await db.district.findFirst({
      where: { id: districtId, stateCode },
      select: { id: true },
    });

    if (!district) {
      return NextResponse.json(
        { message: 'यह जिला चुने हुए राज्य का नहीं है।' },
        { status: 400 },
      );
    }

    const items = await db.assemblyConstituency.findMany({
      where: {
        stateCode,
        districts: {
          some: { districtId: district.id },
        },
      },
      select: {
        id: true,
        nameHi: true,
        nameEn: true,
        seatNumber: true,
      },
      orderBy: { seatNumber: 'asc' },
    });

    return NextResponse.json(
      { items },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Assembly locations failed', error);

    return NextResponse.json(
      { message: 'विधानसभा की सूची लोड नहीं हो सकी।' },
      { status: 500 },
    );
  }
}