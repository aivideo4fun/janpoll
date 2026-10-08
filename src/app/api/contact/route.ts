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
          message: 'नाम, ईमेल और संदेश भरना अनिवार्य है।',
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { success: false, message: 'नाम अधिकतम 100 अक्षरों का होना चाहिए।' },
        { status: 400 }
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        { success: false, message: 'ईमेल बहुत लंबा है।' },
        { status: 400 }
      );
    }

    if (whatsapp && whatsapp.length > 20) {
      return NextResponse.json(
        { success: false, message: 'WhatsApp नंबर अधिकतम 20 अंकों का होना चाहिए।' },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { success: false, message: 'संदेश अधिकतम 5000 अक्षरों का होना चाहिए।' },
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
      message: 'संदेश सफलतापूर्वक भेज दिया गया है।',
    });
  } catch (error) {
    console.error('Contact API error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'संदेश भेजने में त्रुटि हुई।',
      },
      { status: 500 }
    );
  }
}