import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = clean(body.name);
    const email = clean(body.email).toLowerCase();
    const whatsapp = clean(body.whatsapp);
    const message = clean(body.message);

    if (!name || !email || !message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name, email and message are required.',
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Name must be 100 characters or fewer.' },
        { status: 400 }
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        { success: false, message: 'Email must be 255 characters or fewer.' },
        { status: 400 }
      );
    }

    if (whatsapp && whatsapp.length > 20) {
      return NextResponse.json(
        { success: false, message: 'WhatsApp / phone number must be 20 characters or fewer.' },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { success: false, message: 'Message must be 5,000 characters or fewer.' },
        { status: 400 }
      );
    }

    await db.contactMessage.create({
      data: {
        name,
        email,
        whatsapp: whatsapp || null,
        message,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully.',
    });
  } catch (error) {
    console.error('Contact API error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to send your message. Please try again later.',
      },
      { status: 500 }
    );
  }
}