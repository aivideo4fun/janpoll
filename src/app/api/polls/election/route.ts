import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      message:
        'यह पुराना creation तरीका बंद है। अपना पोल बनाएँ वाला नया form खोलें।',
    },
    { status: 410 },
  );
}