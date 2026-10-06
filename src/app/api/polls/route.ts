import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSlug } from '@/lib/slugify';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, deadlineDays, options, districtName, samitiName, gramPanchayatName, gramPanchayatId } = body;

    if (!question || !options || options.length < 2) {
      return NextResponse.json({ message: 'कृपया सवाल और कम से कम 2 विकल्प भरें।' }, { status: 400 });
    }

    const newPoll = await db.poll.create({
      data: {
        question,
        slug: generateSlug(question),
        isVerified: true,
        deadlineDays: Number(deadlineDays) || 3,
        districtName: districtName || null,
        samitiName: samitiName || null,
        gramPanchayatName: gramPanchayatName || null,
        gramPanchayatId: gramPanchayatId ? Number(gramPanchayatId) : null, // 👈 डेटाबेस में सही आईडी सेव होगी
        options: {
          create: options.map((text: string, index: number) => ({ text, order: index })),
        },
      },
    });

    return NextResponse.json({ pollId: newPoll.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating poll via API:', error);
    return NextResponse.json({ message: 'सर्वर त्रुटि हुई।' }, { status: 500 });
  }
}