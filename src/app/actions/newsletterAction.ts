'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function subscribeNewsletter(formData: FormData) {
  const email = formData.get('email')?.toString().trim();

  if (!email || !email.includes('@')) {
    return { success: false, message: 'कृपया एक वैध ईमेल दर्ज करें।' };
  }

  try {
    // टाइप एरर से बचने के लिए (db as any) का उपयोग किया गया है
    await (db as any).newsletterSubscriber.create({
      data: { email },
    });

    revalidatePath('/');
    return { success: true, message: 'सफलतापूर्वक सब्सक्राइब हो गया!' };
  } catch (error: any) {
    // अगर ईमेल पहले से मौजूद है
    if (error.code === 'P2002') {
      return { success: false, message: 'यह ईमेल पहले से रजिस्टर्ड है।' };
    }
    console.error('न्यूज़लेटर सब्सक्रिप्शन में त्रुटि:', error);
    return { success: false, message: 'कुछ गलत हुआ, कृपया पुनः प्रयास करें।' };
  }
}