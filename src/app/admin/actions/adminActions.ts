'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  adminConfigured,
  createAdminSession,
  destroyAdminSession,
  isAdmin,
  safeEqual,
} from '@/lib/admin-auth';

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

/**
 * सख्त सुरक्षा के साथ एडमिन लॉगिन प्रक्रिया
 */
export async function handleLogin(formData: FormData) {
  const username = formValue(formData, 'username');
  const password = String(formData.get('password') ?? '');

  if (!adminConfigured()) {
    redirect('/admin?error=config');
  }

  const adminUser = process.env.ADMIN_USER?.trim() ?? '';
  const adminPass = process.env.ADMIN_PASS ?? '';

  // सुरक्षित तुलना (Timing-safe comparison)
  if (safeEqual(username, adminUser) && safeEqual(password, adminPass)) {
    await createAdminSession();
    const cookieStore = await cookies();

    cookieStore.set({
      name: 'admin_session',
      value: 'authenticated',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12, // 12 घंटे का सत्र (Session timeout)
      path: '/',
    });

    redirect('/admin');
  }

  // गलत क्रेडेंशियल होने पर त्रुटि संदेश के साथ रीडायरेक्ट करें
  redirect('/admin?error=invalid');
}

export async function handleLogout() {
  await destroyAdminSession();
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  redirect('/admin');
}

export async function editPoll(formData: FormData) {
  if (!(await isAdmin())) return;

  const pollId = formValue(formData, 'pollId');
  const question = formValue(formData, 'question');
  const creatorName = formValue(formData, 'creatorName');
  const creatorEmail = formValue(formData, 'creatorEmail');
  const districtName = formValue(formData, 'districtName');
  const samitiName = formValue(formData, 'samitiName');
  const gramPanchayatName = formValue(formData, 'gramPanchayatName');
  const gramPanchayatIdValue = formValue(formData, 'gramPanchayatId');
  const activeValue = formValue(formData, 'active');

  if (!pollId || !question) return;

  const gramPanchayatId = gramPanchayatIdValue ? String(gramPanchayatIdValue) : null;
  const active = activeValue === 'true';

  const optionIds = formData.getAll('optionId').map(String);
  const optionTexts = formData.getAll('optionText').map((v) => String(v).trim());

  try {
    await db.$transaction(async (tx) => {
      await tx.poll.update({
        where: { id: pollId },
        data: {
          question,
          creatorName: creatorName || null,
          creatorEmail: creatorEmail || null,
          districtName: districtName || null,
          samitiName: samitiName || null,
          gramPanchayatName: gramPanchayatName || null,
          gramPanchayatId,
          active,
        } as any,
      });

      for (let i = 0; i < optionIds.length; i++) {
        const optionId = optionIds[i];
        const optionText = optionTexts[i];
        if (!optionId || !optionText) continue;

        await tx.pollOption.updateMany({
          where: { id: optionId, pollId },
          data: { text: optionText },
        });
      }
    });

    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath(`/poll/${pollId}`);
  } catch (error) {
    console.error('पोल संपादित करने में त्रुटि:', error);
  }
}

export async function deletePoll(formData: FormData) {
  if (!(await isAdmin())) return;
  const pollId = formValue(formData, 'pollId');
  if (!pollId) return;

  try {
    await db.poll.delete({ where: { id: pollId } });
    revalidatePath('/admin');
    revalidatePath('/');
  } catch (error) {
    console.error('पोल हटाने में त्रुटि:', error);
  }
}

export async function addPollOption(formData: FormData) {
  if (!(await isAdmin())) return;
  const pollId = formValue(formData, 'pollId');
  const optionText = formValue(formData, 'optionText');

  if (!pollId || !optionText) return;

  try {
    await db.pollOption.create({
      data: { pollId, text: optionText, voteCount: 0 },
    });
    revalidatePath('/admin');
    revalidatePath(`/poll/${pollId}`);
  } catch (error) {
    console.error('विकल्प जोड़ने में त्रुटि:', error);
  }
}

export async function deleteMessage(formData: FormData) {
  if (!(await isAdmin())) return;
  const msgId = formValue(formData, 'msgId');
  if (!msgId) return;

  try {
    await db.contactMessage.delete({ where: { id: msgId } });
    revalidatePath('/admin');
  } catch (error) {
    console.error('संदेश हटाने में त्रुटि:', error);
  }
}