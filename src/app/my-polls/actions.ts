'use server';
import { db } from '@/lib/db';
import { ownerWhere } from '@/lib/polls/owner';
import { revalidatePath } from 'next/cache';

async function submitRequest(form: FormData, status: 'REQUESTED' | 'DEACTIVATION_REQUESTED') {
  const owner = await ownerWhere();
  const reference = form.get('reference');
  if (!owner || typeof reference !== 'string' || !reference.trim() || reference.length > 32) {
    throw new Error('Creator ownership की पुष्टि आवश्यक है।');
  }
  await db.poll.updateMany({
    where: { ...owner, creatorReference: reference, deletionStatus: { in: ['NONE', 'REJECTED', 'APPROVED'] }, ...(status === 'DEACTIVATION_REQUESTED' ? { active: true } : {}) },
    data: { deletionStatus: status, deletionRequestedAt: new Date() },
  });
  revalidatePath('/my-polls');
  revalidatePath('/admin');
  revalidatePath('/admin/polls');
}
export async function requestDeletion(form: FormData) {
  await submitRequest(form, 'REQUESTED');
}
export async function requestDeactivation(form: FormData) {
  await submitRequest(form, 'DEACTIVATION_REQUESTED');
}
// Cached older forms must also submit a request, never change poll activity.
export async function deactivateOwnPoll(form: FormData) {
  await requestDeactivation(form);
}
