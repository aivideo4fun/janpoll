'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { db } from '@/lib/db';
import { generateSlug } from '@/lib/slugify';
import { safeDecode } from '@/lib/location';
import { googleAuthOptions } from '@/lib/google-auth';

function readText(formData: FormData, keys: string[], fallbackUrl: URL | null) {
  // 1. Pehle FormData me check karein
  for (const key of keys) {
    const fromForm = formData.get(key);
    if (typeof fromForm === 'string' && fromForm.trim()) {
      return safeDecode(fromForm.trim());
    }
  }
  // 2. Agar FormData me na ho, toh fallbackUrl (URL parameters) me check karein
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
    throw new Error('कृपया पहले Google से साइन-इन करें।');
  }

  const question = String(formData.get('question') ?? '').trim();
  const deadlineDays = Math.min(
    Math.max(parseInt(String(formData.get('deadlineDays') ?? '3'), 10) || 3, 1),
    30,
  );

  const optionsText = formData
    .getAll('options')
    .map((opt) => (typeof opt === 'string' ? opt.trim() : ''))
    .filter((opt) => opt !== '')
    .slice(0, 8);

  if (!question || optionsText.length < 2) {
    throw new Error('कृपया सवाल और कम से कम 2 विकल्प भरें।');
  }

  const headersList = await headers();
  let referrerUrl: URL | null = null;
  try {
    const referer = headersList.get('referer');
    referrerUrl = referer ? new URL(referer) : null;
  } catch {
    referrerUrl = null;
  }

  // 🔍 लोकेशन और आईडी को फॉर्म या URL से पकड़ना
  const gramPanchayat = readText(formData, ['gramPanchayat', 'gp'], referrerUrl);
  const gpIdStr = readText(formData, ['gramPanchayatId', 'gpId'], referrerUrl);
  const gramPanchayatId = gpIdStr ? parseInt(gpIdStr, 10) : null;

  const samiti = readText(formData, ['samiti'], referrerUrl);
  const district = readText(formData, ['district'], referrerUrl);

  console.log('--- CREATING POLL WITH LOCATION & ID ---');
  console.log('District:', district);
  console.log('Samiti:', samiti);
  console.log('Gram Panchayat:', gramPanchayat);
  console.log('Gram Panchayat ID:', gramPanchayatId);

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
      gramPanchayatId: gramPanchayatId && !isNaN(gramPanchayatId) ? gramPanchayatId : null, // 👈 ID सुरक्षित सेव होगी
      options: {
        create: optionsText.map((text, index) => ({ text, order: index })),
      },
    } as any,
  });

  redirect(`/poll/${newPoll.id}`);
}