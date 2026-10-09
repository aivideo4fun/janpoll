'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function subscribeNewsletter(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();

  if (!email || !email.includes('@')) {
    return { success: false, message: 'कृपया वैध ईमेल दर्ज करें।' };
  }

  try {
    // नया टेबल 'newsletterSubscriber' का उपयोग करते हुए
    await db.newsletterSubscriber.create({
      data: { email },
    });

    revalidatePath('/admin');
    return { success: true, message: 'सفलतापूर्वक सब्सक्राइब हो गया!' };
  } catch (error) {
    console.error('सब्सक्रिप्शन त्रुटि:', error);
    return { success: false, message: 'यह ईमेल पहले से रजिस्टर्ड है।' };
  }
}