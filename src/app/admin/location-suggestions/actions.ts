'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { loadLocationCatalog } from '@/lib/admin/location-catalog';
import { catalogState, suggestLocations } from '@/lib/admin/poll-locations';

export async function applyLocationSuggestions(form: FormData) {
  if (!(await isAdmin())) throw new Error('Admin access required.');
  if (form.get('confirmed') !== 'yes') throw new Error('Preview की पुष्टि करें।');
  const raw = form.getAll('selection');
  if (!raw.length || raw.length > 20) throw new Error('एक बार में 1 से 20 matches चुनें।');
  const items: { id: string; key: string; updatedAt: string }[] = raw.map(value => {
    if (typeof value !== 'string' || value.length > 600) throw new Error('Invalid selection.');
    let parsed;
    try { parsed = JSON.parse(value); } catch { throw new Error('Invalid selection.'); }
    if (!parsed || typeof parsed.id !== 'string' || !parsed.id || parsed.id.length > 100 || typeof parsed.key !== 'string' || parsed.key.length > 120 || typeof parsed.updatedAt !== 'string' || !Number.isFinite(Date.parse(parsed.updatedAt))) throw new Error('Invalid selection.');
    return { id: parsed.id, key: parsed.key, updatedAt: parsed.updatedAt };
  });
  if (new Set(items.map(i => i.id)).size !== items.length) throw new Error('Duplicate selection.');
  const catalog = await loadLocationCatalog();
  const polls = await db.poll.findMany({ where: { id: { in: items.map(i => i.id) } }, select: { id: true, updatedAt: true, question: true, stateCode: true, districtId: true, districtName: true, samitiId: true, samitiName: true, gramPanchayatId: true, gramPanchayatName: true, samitiWardId: true, zilaWardId: true, assemblyId: true } });
  let applied = 0;
  await db.$transaction(async tx => {
    for (const item of items) {
      const poll = polls.find(p => p.id === item.id);
      if (!poll || poll.updatedAt.toISOString() !== item.updatedAt) continue;
      const result = suggestLocations(poll, catalog);
      if (result.status !== 'match') continue;
      const match = result.candidates[0];
      if (`${match.kind}:${match.id}` !== item.key) continue;
      const stateCode = catalogState(match.district);
      // Recheck the entire proposal on the server and prevent overwriting a
      // concurrently edited or already mapped poll. Voting/creator fields stay intact.
      const changed = await tx.poll.updateMany({ where: { id: poll.id, updatedAt: poll.updatedAt, samitiId: null, gramPanchayatId: null, samitiWardId: null, zilaWardId: null, assemblyId: null }, data: {
        scope: 'STATE', stateCode,
        districtId: match.district.id, districtName: match.district.nameHi,
        samitiId: match.samiti.id, samitiName: match.samiti.nameHi,
        ...(match.gp ? { gramPanchayatId: match.gp.id, gramPanchayatName: match.gp.nameHi } : {}),
      } });
      applied += changed.count;
    }
  });
  revalidatePath('/', 'layout');
  revalidatePath('/admin/poll-activity');
  revalidatePath('/admin/poll-locations');
  revalidatePath('/admin/location-suggestions');
  redirect(`/admin/location-suggestions?applied=${applied}&skipped=${items.length - applied}`);
}
