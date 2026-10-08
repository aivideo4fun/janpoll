import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSlug } from '@/lib/slugify';

// 📥 GET Method: होमपेज के लिए सभी सक्रिय पोल्स और कुल वोटों का डेटा भेजने के लिए
export async function GET() {
  try {
    const [polls, voteSum] = await Promise.all([
      db.poll.findMany({
        where: { active: true },
        select: {
          id: true,
          slug: true,
          question: true,
          active: true,
          createdAt: true,
          deadlineDays: true,
          options: {
            select: { id: true, text: true, voteCount: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.pollOption.aggregate({ _sum: { voteCount: true } }),
    ]);

    const totalVotesSum = voteSum._sum.voteCount ?? 0;

    return NextResponse.json({ polls, totalVotesSum }, { status: 200 });
  } catch (error) {
    console.error('पोल डेटा फेच करने में एपीआई त्रुटि:', error);
    return NextResponse.json({ message: 'सर्वर पर तकनीकी त्रुटि हुई है।' }, { status: 500 });
  }
}

// 📤 POST Method: नया पोल बनाने के लिए
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
        gramPanchayatId: gramPanchayatId || null,
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