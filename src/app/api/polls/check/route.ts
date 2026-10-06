import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gp = searchParams.get('gp');

    if (!gp) {
      return NextResponse.json({ pollId: null }, { status: 400 });
    }

    const decodedGp = decodeURIComponent(gp).trim();

    // 🛡️ टाइपकास्टिंग के साथ डेटाबेस से सभी एक्टिव पोल्स फेच करें
    const polls = (await db.poll.findMany({
      where: { active: true },
      select: { id: true, gramPanchayatName: true },
    })) as { id: string; gramPanchayatName: string | null }[];

    const matchedPoll = polls.find(
      (p) => p.gramPanchayatName && p.gramPanchayatName.trim().toLowerCase() === decodedGp.toLowerCase()
    );

    if (matchedPoll) {
      return NextResponse.json({ pollId: matchedPoll.id });
    }

    return NextResponse.json({ pollId: null });
  } catch (error) {
    console.error('Error checking poll existence:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}