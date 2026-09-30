import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, creatorName, creatorEmail, deadlineDays, options } = body;

    if (!question || !options || options.length < 2) {
      return NextResponse.json(
        { message: 'सवाल और कम से कम 2 विकल्प जरूरी हैं।' },
        { status: 400 }
      );
    }

    const poll = await db.poll.create({
      data: {
        question,
        creatorName: creatorName || 'Anonymous',
        creatorEmail: creatorEmail || '',
        deadlineDays: deadlineDays ? Number(deadlineDays) : 3,
        options: {
          create: options.map((text: string) => ({ text })),
        },
      },
    });

    return NextResponse.json({ success: true, pollId: poll.id }, { status: 201 });
  } catch (error) {
    console.error('API Poll Create Error:', error);
    return NextResponse.json(
      { message: 'सर्वर पर कुछ गलत हो गया।' },
      { status: 500 }
    );
  }
}