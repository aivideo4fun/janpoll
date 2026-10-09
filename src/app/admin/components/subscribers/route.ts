import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const IST = 'Asia/Kolkata';

function istStamp(value: Date | string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const p = (t: string) => parts.find((x) => x.type === t)?.value ?? '';
  return `${p('day')}-${p('month')}-${p('year')} ${p('hour')}:${p('minute')}`;
}

// CSV में सुरक्षित मान (Excel formula injection से बचाव सहित)
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
    const subscribers: any[] = await (db as any).newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const header = ['क्रम संख्या', 'ईमेल पता', 'सदस्यता तिथि और समय (IST)'];
    const rows = subscribers.map((s, i) => [i + 1, s.email, istStamp(s.createdAt)]);

    // BOM जोड़ने से Excel में हिंदी अक्षर सही दिखते हैं
    const csv =
      '\uFEFF' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');

    const day = new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date());

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="newsletter-subscribers-${day}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('सब्सक्राइबर एक्सपोर्ट त्रुटि:', error);
    return new NextResponse('एक्सपोर्ट करने में त्रुटि हुई।', { status: 500 });
  }
}