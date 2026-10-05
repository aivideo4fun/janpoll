import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { googleAuthOptions } from '@/lib/google-auth';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { generateSlug } from '@/lib/slugify';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(googleAuthOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Kripya poll banane ke liye pehle Google se sign in karein.' },
        { status: 401 }
      );
    }

    const { question, deadlineDays, options, district, samiti, gramPanchayat } = await req.json();

    if (!question || !options || options.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Sawal aur kam se kam 2 vikalp anivary hain.' },
        { status: 400 }
      );
    }

    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const creatorIp = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

    const slugText = generateSlug(question);

    const poll = await db.poll.create({
      data: {
        question,
        slug: slugText,
        creatorName: session.user.name || 'Google Verified User',
        creatorEmail: session.user.email,
        creatorIp,
        deadlineDays: parseInt(deadlineDays) || 3,
        districtName: district || null,
        samitiName: samiti || null,
        gramPanchayatName: gramPanchayat || null,
        options: {
          create: options.map((text: string, index: number) => ({ 
            text, 
            order: index 
          })),
        },
      },
    });

    return NextResponse.json({ success: true, pollId: poll.id, slug: slugText });
  } catch (error) {
    console.error('Create poll error:', error);
    return NextResponse.json(
      { success: false, message: 'Poll banane me truti hui.' },
      { status: 500 }
    );
  }
}