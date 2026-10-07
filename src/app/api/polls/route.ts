import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSlug } from '@/lib/slugify';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      question, 
      deadlineDays, 
      options, 
      districtName, 
      samitiName, 
      gramPanchayatName, 
      gramPanchayatId,
      creatorName,
      creatorEmail 
    } = body;

    if (!question || !options || options.length < 2) {
      return NextResponse.json({ message: 'कृपया पोल का प्रश्न और कम से कम 2 विकल्प अनिवार्य रूप से भरें।' }, { status: 400 });
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
        gramPanchayatId: gramPanchayatId ? Number(gramPanchayatId) : null,
        creatorName: creatorName || null,
        creatorEmail: creatorEmail || null,
        options: {
          create: options.map((text: string, index: number) => ({ text, order: index })),
        },
      },
    });

    return NextResponse.json({ pollId: newPoll.id }, { status: 201 });
  } catch (error: any) {
    console.error('पोल बनाने के दौरान एपीआई में त्रुटि:', error);
    return NextResponse.json({ message: 'सर्वर पर तकनीकी त्रुटि हुई है।' }, { status: 500 });
  }
}