import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { googleAuthOptions } from '@/lib/google-auth';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(googleAuthOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: 'कृपया पोल बनाने के लिए पहले Google से साइन इन करें।' },
        { status: 401 }
      );
    }

    const { question, deadlineDays, options } = await req.json();

    if (!question || !options || options.length < 2) {
      return NextResponse.json(
        { success: false, message: 'सवाल और कम से कम 2 विकल्प अनिवार्य हैं।' },
        { status: 400 }
      );
    }

    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const creatorIp = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

    const poll = await db.poll.create({
      data: {
        question,
        creatorName: session.user.name || 'Google Verified User',
        creatorEmail: session.user.email,
        creatorIp,
        deadlineDays: parseInt(deadlineDays) || 3,
        options: {
          create: options.map((text: string) => ({ text })),
        },
      },
    });

    return NextResponse.json({ success: true, pollId: poll.id });
  } catch (error) {
    console.error('Create poll error:', error);
    return NextResponse.json(
      { success: false, message: 'पोल बनाने में त्रुटि हुई।' },
      { status: 500 }
    );
  }
}