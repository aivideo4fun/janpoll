'use server';

import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export async function createPollAction(formData: FormData) {
  const question = formData.get('question') as string;
  const creatorName = formData.get('creatorName') as string;
  const creatorEmail = formData.get('creatorEmail') as string;
  const deadlineDays = parseInt(formData.get('deadlineDays') as string) || 3;
  
  // Get options from form data
  const optionsText = formData.getAll('options').filter((opt) => typeof opt === 'string' && opt.trim() !== '') as string[];

  if (!question || optionsText.length < 2) {
    throw new Error('Kripya question aur kam se kam 2 options bharein.');
  }

  // Get Creator IP safely inside async function
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const creatorIp = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

  const newPoll = await db.poll.create({
    data: {
      question,
      creatorName,
      creatorEmail,
      creatorIp,
      deadlineDays,
      options: {
        create: optionsText.map((text) => ({ text })),
      },
    },
  });

  redirect(`/poll/${newPoll.id}`);
}