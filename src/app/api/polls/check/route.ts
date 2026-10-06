import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gp = searchParams.get('gp');

    if (!gp) {
      return NextResponse.json({ pollId: null }, { status: 400 });
    }

    // डेटाबेस में ग्राम पंचायत के नाम से एक्टिव पोल ढूंढें
    const poll = await db.poll.findFirst({
      where: {
        active: true,
        gramPanchayatName: {
          equals: gp.trim(),
          mode: 'insensitive',
        },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (poll) {
      return NextResponse.json({ pollId: poll.id });
    }

    return NextResponse.json({ pollId: null });
  } catch (error) {
    console.error('Error checking poll existence:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}