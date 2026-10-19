'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { googleAuthOptions } from '@/lib/google-auth';

export async function updateProfileName(formData: FormData) {
  const session = await getServerSession(googleAuthOptions);

  const userId = (
    session?.user as { id?: unknown } | undefined
  )?.id;

  if (typeof userId !== 'string' || !userId) {
    return {
      success: false,
      message: 'दोबारा login करें।',
      name: '',
    };
  }

  const raw = formData.get('name');

  const name =
    typeof raw === 'string'
      ? raw.normalize('NFC').replace(/\s+/g, ' ').trim()
      : '';

  if (
    name.length < 2 ||
    name.length > 100 ||
    /[\u0000-\u001F\u007F]/.test(name)
  ) {
    return {
      success: false,
      message: 'नाम 2 से 100 अक्षरों में लिखें।',
      name: '',
    };
  }

  try {
    const user = await db.user.update({
      where: { id: userId },
      data: { name },
      select: { name: true },
    });

    revalidatePath('/profile');

    return {
      success: true,
      message: 'आपका नाम अपडेट हो गया है।',
      name: user.name ?? name,
    };
  } catch (error) {
    console.error('Profile update failed', error);

    return {
      success: false,
      message: 'नाम अपडेट नहीं हो सका। दोबारा कोशिश करें।',
      name: '',
    };
  }
}