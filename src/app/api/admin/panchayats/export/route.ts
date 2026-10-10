import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { getGpStatsMap } from '@/lib/coverage';

export const dynamic = 'force-dynamic';

// Excel formula injection से बचाव सहित सुरक्षित CSV मान
function cell(value: unknown) {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) {
    return new NextResponse('अनधिकृत अनुरोध', { status: 401 });
  }

  try {
    const [gps, stats] = await Promise.all([
      db.gramPanchayat.findMany({
        select: {
          id: true,
          nameHi: true,
          district: { select: { nameHi: true } },
          samiti: { select: { nameHi: true } },
        },
        orderBy: [
          { district: { nameEn: 'asc' } },
          { samiti: { nameEn: 'asc' } },
          { nameEn: 'asc' },
        ],
      }),
      getGpStatsMap(),
    ]);

    const header = ['जिला', 'पंचायत समिति', 'ग्राम पंचायत', 'कुल पोल', 'चालू पोल', 'स्थिति'];

    const rows = gps.map((g) => {
      const s = stats.get(g.id);
      const status = s?.running ? 'चालू पोल है' : s?.any ? 'पोल बना था, अभी चालू नहीं' : 'कभी पोल नहीं बना';
      return [g.district.nameHi, g.samiti.nameHi, g.nameHi, s?.any ?? 0, s?.running ?? 0, status];
    });

    // BOM जोड़ने से Excel में हिंदी अक्षर सही दिखते हैं
    const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');

    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="panchayat-poll-status-${day}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('पंचायत एक्सपोर्ट त्रुटि:', error);
    return new NextResponse('एक्सपोर्ट करने में त्रुटि हुई।', { status: 500 });
  }
}
