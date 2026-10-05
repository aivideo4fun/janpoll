'use server';

import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { generateSlug } from '@/lib/slugify';

export async function createPollAction(formData: FormData) {
  const question = formData.get('question') as string;
  const creatorName = formData.get('creatorName') as string;
  const creatorEmail = formData.get('creatorEmail') as string;
  const deadlineDays = parseInt(formData.get('deadlineDays') as string) || 3;
  
  // 📍 Location fields
  const district = formData.get('district') as string;
  const samiti = formData.get('samiti') as string;
  const gramPanchayat = formData.get('gramPanchayat') as string;
  
  // 🔄 Get options and filter out empty ones while keeping their exact order
  const optionsText = formData.getAll('options')
    .map(opt => typeof opt === 'string' ? opt.trim() : '')
    .filter(opt => opt !== '');

  if (!question || optionsText.length < 2) {
    throw new Error('कृपया सवाल और कम से कम 2 विकल्प भरें।');
  }

  // Get Creator IP safely inside async function
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const creatorIp = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

  // Generate SEO slug
  const slugText = generateSlug(question);

  const newPoll = await db.poll.create({
    data: {
      question,
      slug: slugText,
      creatorName,
      creatorEmail,
      creatorIp,
      deadlineDays,
      districtName: district || null,
      samitiName: samiti || null,
      gramPanchayatName: gramPanchayat || null,
      options: {
        // map करते वक्त क्रम अपने आप सुरक्षित रहेगा
        create: optionsText.map((text) => ({ text })),
      },
    },
  });

  redirect(`/poll/${newPoll.id}`);
}