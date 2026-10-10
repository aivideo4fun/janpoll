'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { db } from '@/lib/db';
import { generateSlug } from '@/lib/slugify';
import { safeDecode } from '@/lib/location';
import { googleAuthOptions } from '@/lib/google-auth';

function readText(formData: FormData, keys: string[], fallbackUrl: URL | null) {
  for (const key of keys) {
    const fromForm = formData.get(key);
    if (typeof fromForm === 'string' && fromForm.trim()) {
      return safeDecode(fromForm.trim());
    }
  }
  if (fallbackUrl) {
    for (const key of keys) {
      const fromUrl = fallbackUrl.searchParams.get(key);
      if (fromUrl && fromUrl.trim()) {
        return safeDecode(fromUrl.trim());
      }
    }
  }
  return null;
}

export async function createPollAction(formData: FormData) {
  const session = await getServerSession(googleAuthOptions);
  if (!session || !session.user) {
    throw new Error('Kripya pehle Google se sign-in karein.');
  }

  const question = String(formData.get('question') ?? '').trim();
  
  // Handling deadline days or specific expiry date
  const rawDays = String(formData.get('deadlineDays') ?? '3');
  let deadlineDays = Math.min(Math.max(parseInt(rawDays, 10) || 3, 1), 60);

  const optionsText = formData
    .getAll('options')
    .map((opt) => (typeof opt === 'string' ? opt.trim() : ''))
    .filter((opt) => opt !== '')
    .slice(0, 15);

  if (!question || optionsText.length < 2) {
    throw new Error('Kripya vaidh prashn evam nyuntam 2 vikalp darj karein.');
  }

  const headersList = await headers();
  let referrerUrl: URL | null = null;
  try {
    const referer = headersList.get('referer');
    referrerUrl = referer ? new URL(referer) : null;
  } catch {
    referrerUrl = null;
  }

  const gramPanchayat = readText(formData, ['gramPanchayat', 'gp'], referrerUrl);
  const gpIdStr = readText(formData, ['gramPanchayatId', 'gpId'], referrerUrl);
  const gramPanchayatId = gpIdStr ? parseInt(gpIdStr, 10) : null;

  const samiti = readText(formData, ['samiti'], referrerUrl);
  const district = readText(formData, ['district'], referrerUrl);

  const forwardedFor = headersList.get('x-forwarded-for');
  const creatorIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1').slice(0, 45);

  const newPoll = await db.poll.create({
    data: {
      question,
      slug: generateSlug(question),
      creatorName: session.user.name ?? 'Verified User',
      creatorEmail: session.user.email ?? '',
      isVerified: true,
      creatorIp,
      deadlineDays,
      districtName: district,
      samitiName: samiti,
      gramPanchayatName: gramPanchayat,
      gramPanchayatId: gramPanchayatId && !isNaN(gramPanchayatId) ? gramPanchayatId : null,
      options: {
        create: optionsText.map((text, index) => ({ text, order: index })),
      },
    } as any,
  });

  redirect(`/poll/${newPoll.id}`);
}