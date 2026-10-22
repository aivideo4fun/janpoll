'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

import { normalizeMobile } from '@/lib/profile-mobile';
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

  let mobile:string|null;
  try { mobile=normalizeMobile(String(formData.get('mobile') || '')); }
  catch { return {success:false,message:'सही 10 अंकों का भारतीय mobile या +country code वाला नंबर लिखें। नंबर वैकल्पिक है।',name:''}; }
  try {
    const user = await db.$transaction(async tx => {
      const updated = await tx.user.update({where:{id:userId},data:{name},select:{name:true}});
      await tx.$executeRaw`UPDATE "User" SET mobile = ${mobile} WHERE id = ${userId}`;
      return updated;
    });

    revalidatePath('/profile');

    return {
      success: true,
      message: 'आपकी profile अपडेट हो गई है।',
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