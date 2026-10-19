'use server';
import { db } from '@/lib/db';
import { ownerWhere } from '@/lib/polls/owner';
import { revalidatePath } from 'next/cache';
export async function requestDeletion(form: FormData) {
  const owner = await ownerWhere();
  const reference = form.get('reference');
  if (!owner || typeof reference !== 'string' || reference.length > 32) throw new Error('Creator ownership की पुष्टि आवश्यक है।');
  await db.poll.updateMany({
    where: { ...owner, creatorReference: reference, deletionStatus: 'NONE' },
    data: { deletionStatus: 'REQUESTED', deletionRequestedAt: new Date() },
  });
  revalidatePath('/my-polls');
}
export async function deactivateOwnPoll(form: FormData) {
  const owner = await ownerWhere();
  const reference = form.get('reference');
  if (!owner || typeof reference !== 'string' || reference.length > 32) throw new Error('Creator ownership की पुष्टि आवश्यक है।');
  await db.poll.updateMany({ where: { ...owner, creatorReference: reference }, data: { active: false } });
  revalidatePath('/', 'layout');
}
