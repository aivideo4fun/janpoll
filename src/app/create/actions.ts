'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { db } from '@/lib/db';
import { generateSlug } from '@/lib/slugify';
import { getCreator } from '@/lib/creator-auth';
import { safeDecode } from '@/lib/location';

function readText(formData: FormData, keys: string[], fallbackUrl: URL | null) {
  for (const key of keys) {
    const fromForm = formData.get(key);
    if (typeof fromForm === 'string' && fromForm.trim()) {
      return safeDecode(fromForm.trim());
    }
  }
  // Form में field न हो तो create page के URL (?gp=&samiti=&district=) से लें
  for (const key of keys) {
    const fromUrl = fallbackUrl?.searchParams.get(key);
    if (fromUrl && fromUrl.trim()) return fromUrl.trim();
  }
  return null;
}

export async function createPollAction(formData: FormData) {
  const creator = await getCreator();
  if (!creator) {
    throw new Error('पहले Google से साइन-इन करें।');
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
  if (question.length > 500 || optionsText.some((o) => o.length > 255)) {
    throw new Error('सवाल या विकल्प बहुत लंबा है।');
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
  const samiti = readText(formData, ['samiti'], referrerUrl);
  const district = readText(formData, ['district'], referrerUrl);

  const forwardedFor = headersList.get('x-forwarded-for');
  const creatorIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1').slice(0, 45);

  const newPoll = await db.poll.create({
    data: {
      question,
      slug: generateSlug(question),
      // नाम और email form से नहीं, Google से verified cookie से आते हैं
      creatorName: creator.name,
      creatorEmail: creator.email,
      isVerified: true,
      creatorIp,
      deadlineDays,
      districtName: district,
      samitiName: samiti,
      gramPanchayatName: gramPanchayat,
      options: {
        create: optionsText.map((text, index) => ({ text, order: index })),
      },
    },
  });

  redirect(`/poll/${newPoll.id}`);
}