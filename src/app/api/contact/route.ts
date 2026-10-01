import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'सभी fields भरना अनिवार्य है।' },
        { status: 400 }
      );
    }

    await db.contactMessage.create({
      data: {
        name,
        email,
        message,
      },
    });

    return NextResponse.json({ success: true, message: 'संदेश सफलतापूर्वक भेज दिया गया है।' });
  } catch (error) {
    console.error('Contact error:', error);
    return NextResponse.json(
      { success: false, message: 'संदेश भेजने में त्रुटि हुई।' },
      { status: 500 }
    );
  }
}