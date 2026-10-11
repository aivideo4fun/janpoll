'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';

function val(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function finish(section: 'map' | 'loc', message: string): never {
  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/rajasthan', 'layout');
  redirect(`/admin?${section}=1&msg=${encodeURIComponent(message)}`);
}

// Har pankti: "Hindi naam | English name"
function parseNames(text: string) {
  const seen = new Set<string>();
  const out: { nameHi: string; nameEn: string }[] = [];

  for (const line of text.split(/\r?\n/)) {
    const [hi, en] = line.split('|').map((s) => s.trim());
    if (!hi) continue;
    const nameEn = en || hi;
    const key = nameEn.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ nameHi: hi.slice(0, 150), nameEn: nameEn.slice(0, 150) });
  }

  return out.slice(0, 2000);
}

// Har pankti: "1 | Ward ka naam"
function parseWards(text: string) {
  const seen = new Set<number>();
  const out: { wardNo: number; nameHi: string }[] = [];

  for (const line of text.split(/\r?\n/)) {
    const [no, name] = line.split('|').map((s) => s.trim());
    const wardNo = parseInt(no ?? '', 10);
    if (!wardNo || wardNo < 1 || wardNo > 500 || seen.has(wardNo)) continue;
    seen.add(wardNo);
    out.push({ wardNo, nameHi: (name || `वार्ड ${wardNo}`).slice(0, 150) });
  }

  return out;
}

/** Poll ko district / samiti / gram panchayat se jodna */
export async function assignPollLocation(formData: FormData) {
  if (!(await isAdmin())) return;

  const pollId = val(formData, 'pollId');
  const districtId = val(formData, 'districtId');
  let samitiId = val(formData, 'samitiId');
  const gpId = val(formData, 'gramPanchayatId');

  if (!pollId || !districtId) return;

  let message = '';

  try {
    const district = await db.district.findUnique({
      where: { id: districtId },
      select: { nameHi: true },
    });

    if (!district) {
      message = 'Chuna hua jila nahi mila.';
    } else {
      let samitiName: string | null = null;
      let gramPanchayatName: string | null = null;
      let gramPanchayatId: string | null = null;

      if (gpId) {
        const gp = await db.gramPanchayat.findFirst({
          where: { id: gpId, districtId },
          select: {
            id: true,
            nameHi: true,
            samitiId: true,
            samiti: { select: { nameHi: true } },
          },
        });

        if (gp) {
          gramPanchayatId = gp.id;
          gramPanchayatName = gp.nameHi;
          samitiId = gp.samitiId;
          samitiName = gp.samiti.nameHi;
        }
      }

      if (!samitiName && samitiId) {
        const samiti = await db.panchayatSamiti.findFirst({
          where: { id: samitiId, districtId },
          select: { nameHi: true },
        });
        if (samiti) samitiName = samiti.nameHi;
      }

      await db.poll.update({
        where: { id: pollId },
        data: {
          districtName: district.nameHi,
          samitiName,
          gramPanchayatName,
          gramPanchayatId,
        },
      });

      revalidatePath(`/poll/${pollId}`);

      message = gramPanchayatId
        ? `Poll ko ${gramPanchayatName} panchayat (${samitiName}, ${district.nameHi}) se jod diya gaya.`
        : `Poll ko ${district.nameHi}${samitiName ? ` · ${samitiName}` : ''} se joda gaya.`;
    }
  } catch (error) {
    console.error('Poll mapping error:', error);
    message = 'Poll jodne me truti hui.';
  }

  finish('map', message);
}

/** Tehsilein jorna */
export async function addTehsils(formData: FormData) {
  if (!(await isAdmin())) return;

  const districtId = val(formData, 'districtId');
  const items = parseNames(val(formData, 'items'));
  let message = '';

  if (!districtId || items.length === 0) {
    message = 'Jila chune aur kam se kam ek tehsil ka naam likhein.';
  } else {
    try {
      const result = await db.tehsil.createMany({
        data: items.map((i) => ({ districtId, nameHi: i.nameHi, nameEn: i.nameEn })),
        skipDuplicates: true,
      });
      const skipped = items.length - result.count;
      message = `${result.count} nayi tehsilein jodi gayi${skipped > 0 ? ` (${skipped} pehle se maujud thi)` : ''}.`;
    } catch (error) {
      console.error('Tehsil error:', error);
      message = 'Tehsilein jodne me truti hui.';
    }
  }

  finish('loc', message);
}

/** Panchayat Samiti jorna */
export async function addSamitis(formData: FormData) {
  if (!(await isAdmin())) return;

  const districtId = val(formData, 'districtId');
  const items = parseNames(val(formData, 'items'));
  let message = '';

  if (!districtId || items.length === 0) {
    message = 'Jila chune aur kam se kam ek naam likhein.';
  } else {
    try {
      const result = await db.panchayatSamiti.createMany({
        data: items.map((i) => ({ districtId, nameHi: i.nameHi, nameEn: i.nameEn })),
        skipDuplicates: true,
      });
      const skipped = items.length - result.count;
      message = `${result.count} nayi panchayat samitiyan jodi gayi${skipped > 0 ? ` (${skipped} pehle se maujud thi)` : ''}.`;
    } catch (error) {
      console.error('Samiti error:', error);
      message = 'Panchayat samitiyan jodne me truti hui.';
    }
  }

  finish('loc', message);
}

/** Gram Panchayat jorna */
export async function addGramPanchayats(formData: FormData) {
  if (!(await isAdmin())) return;

  const samitiId = val(formData, 'samitiId');
  const items = parseNames(val(formData, 'items'));
  let message = '';

  if (!samitiId || items.length === 0) {
    message = 'Panchayat samiti chune aur kam se kam ek naam likhein.';
  } else {
    try {
      const samiti = await db.panchayatSamiti.findUnique({
        where: { id: samitiId },
        select: { districtId: true },
      });

      if (!samiti) {
        message = 'Chuni hui panchayat samiti nahi mili.';
      } else {
        const result = await db.gramPanchayat.createMany({
          data: items.map((i) => ({
            districtId: samiti.districtId,
            samitiId,
            nameHi: i.nameHi,
            nameEn: i.nameEn,
          })),
          skipDuplicates: true,
        });
        const skipped = items.length - result.count;
        message = `${result.count} nayi gram panchayatein jodi gayi${skipped > 0 ? ` (${skipped} pehle se maujud thi)` : ''}.`;
      }
    } catch (error) {
      console.error('GP error:', error);
      message = 'Gram panchayatein jodne me truti hui.';
    }
  }

  finish('loc', message);
}

/** Samiti Ward jorna */
export async function addSamitiWards(formData: FormData) {
  if (!(await isAdmin())) return;

  const samitiId = val(formData, 'samitiId');
  const items = parseWards(val(formData, 'items'));
  let message = '';

  if (!samitiId || items.length === 0) {
    message = 'Panchayat samiti chune aur ward number (jaise 1 | naam) likhein.';
  } else {
    try {
      const result = await db.samitiWard.createMany({
        data: items.map((i) => ({ samitiId, wardNo: i.wardNo, nameHi: i.nameHi })),
        skipDuplicates: true,
      });
      const skipped = items.length - result.count;
      message = `${result.count} naye samiti ward jode gaye${skipped > 0 ? ` (${skipped} pehle se maujud the)` : ''}.`;
    } catch (error) {
      console.error('Samiti Ward error:', error);
      message = 'Samiti ward jodne me truti hui.';
    }
  }

  finish('loc', message);
}

/** Ward ke antargat Gaon jorna */
export async function addVillages(formData: FormData) {
  if (!(await isAdmin())) return;

  const wardId = val(formData, 'wardId');
  const items = parseNames(val(formData, 'items'));
  let message = '';

  if (!wardId || items.length === 0) {
    message = 'Samiti ward chune aur kam se kam ek gaon ka naam likhein.';
  } else {
    try {
      const result = await db.village.createMany({
        data: items.map((i) => ({
          wardId,
          nameHi: i.nameHi,
          nameEn: i.nameEn,
        })),
        skipDuplicates: true,
      });
      const skipped = items.length - result.count;
      message = `${result.count} naye gaon jode gaye${skipped > 0 ? ` (${skipped} pehle se maujud the)` : ''}.`;
    } catch (error) {
      console.error('Village error:', error);
      message = 'Gaon jodne me truti hui.';
    }
  }

  finish('loc', message);
}

/** Zila Parishad Ward jorna */
export async function addZilaWards(formData: FormData) {
  if (!(await isAdmin())) return;

  const districtId = val(formData, 'districtId');
  const items = parseWards(val(formData, 'items'));
  let message = '';

  if (!districtId || items.length === 0) {
    message = 'Jila chune aur ward number (jaise 1 | naam) likhein.';
  } else {
    try {
      const result = await db.zilaParishadWard.createMany({
        data: items.map((i) => ({ districtId, wardNo: i.wardNo, nameHi: i.nameHi })),
        skipDuplicates: true,
      });
      const skipped = items.length - result.count;
      message = `${result.count} naye zila parishad ward jode gaye${skipped > 0 ? ` (${skipped} pehle se maujud the)` : ''}.`;
    } catch (error) {
      console.error('Zila Ward error:', error);
      message = 'Zila parishad ward jodne me truti hui.';
    }
  }

  finish('loc', message);
}