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
      message = 'चुना हुआ जिला नहीं मिला।';
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
        ? `पोल को ${gramPanchayatName} पंचायत (${samitiName}, ${district.nameHi}) से जोड़ दिया गया।`
        : `पोल को ${district.nameHi}${samitiName ? ` · ${samitiName}` : ''} से जोड़ा गया।`;
    }
  } catch (error) {
    console.error('Poll mapping error:', error);
    message = 'पोल को जोड़ने में त्रुटि हुई।';
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
    message = 'जिला चुनें और कम से कम एक तहसील का नाम लिखें।';
  } else {
    try {
      const result = await db.tehsil.createMany({
        data: items.map((i) => ({ districtId, nameHi: i.nameHi, nameEn: i.nameEn })),
        skipDuplicates: true,
      });
      const skipped = items.length - result.count;
      message = `${result.count} नई तहसीलें जोड़ी गईं${skipped > 0 ? ` (${skipped} पहले से मौजूद थीं)` : ''}।`;
    } catch (error) {
      console.error('Tehsil error:', error);
      message = 'तहसीलें जोड़ने में त्रुटि हुई।';
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
    message = 'जिला चुनें और कम से कम एक नाम लिखें।';
  } else {
    try {
      const result = await db.panchayatSamiti.createMany({
        data: items.map((i) => ({ districtId, nameHi: i.nameHi, nameEn: i.nameEn })),
        skipDuplicates: true,
      });
      const skipped = items.length - result.count;
      message = `${result.count} नई पंचायत समितियाँ जोड़ी गईं${skipped > 0 ? ` (${skipped} पहले से मौजूद थीं)` : ''}।`;
    } catch (error) {
      console.error('Samiti error:', error);
      message = 'पंचायत समितियाँ जोड़ने में त्रुटि हुई।';
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
    message = 'पंचायत समिति चुनें और कम से कम एक नाम लिखें।';
  } else {
    try {
      const samiti = await db.panchayatSamiti.findUnique({
        where: { id: samitiId },
        select: { districtId: true },
      });

      if (!samiti) {
        message = 'चुनी हुई पंचायत समिति नहीं मिली।';
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
        message = `${result.count} नई ग्राम पंचायतें जोड़ी गईं${skipped > 0 ? ` (${skipped} पहले से मौजूद थीं)` : ''}।`;
      }
    } catch (error) {
      console.error('GP error:', error);
      message = 'ग्राम पंचायतें जोड़ने में त्रुटि हुई।';
    }
  }

  finish('loc', message);
}

/** Samiti Ward jorna (Panchayat Samiti ke antargat ward) */
export async function addSamitiWards(formData: FormData) {
  if (!(await isAdmin())) return;

  const samitiId = val(formData, 'samitiId');
  const items = parseWards(val(formData, 'items'));
  let message = '';

  if (!samitiId || items.length === 0) {
    message = 'पंचायत समिति चुनें और वार्ड नंबर (जैसे 1 | नाम) लिखें।';
  } else {
    try {
      const result = await db.samitiWard.createMany({
        data: items.map((i) => ({ samitiId, wardNo: i.wardNo, nameHi: i.nameHi })),
        skipDuplicates: true,
      });
      const skipped = items.length - result.count;
      message = `${result.count} नए समिति वार्ड जोड़े गए${skipped > 0 ? ` (${skipped} पहले से मौजूद थे)` : ''}।`;
    } catch (error) {
      console.error('Samiti Ward error:', error);
      message = 'समिति वार्ड जोड़ने में त्रुटि हुई।';
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
    message = 'समिति वार्ड चुनें और कम से कम एक गाँव का नाम लिखें।';
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
      message = `${result.count} नए गाँव जोड़े गए${skipped > 0 ? ` (${skipped} पहले से मौजूद थे)` : ''}।`;
    } catch (error) {
      console.error('Village error:', error);
      message = 'गाँव जोड़ने में त्रुटि हुई।';
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
    message = 'जिला चुनें और वार्ड नंबर (जैसे 1 | नाम) लिखें।';
  } else {
    try {
      const result = await db.zilaParishadWard.createMany({
        data: items.map((i) => ({ districtId, wardNo: i.wardNo, nameHi: i.nameHi })),
        skipDuplicates: true,
      });
      const skipped = items.length - result.count;
      message = `${result.count} नए जिला परिषद वार्ड जोड़े गए${skipped > 0 ? ` (${skipped} पहले से मौजूद थे)` : ''}।`;
    } catch (error) {
      console.error('Zila Ward error:', error);
      message = 'जिला परिषद वार्ड जोड़ने में त्रुटि हुई।';
    }
  }

  finish('loc', message);
}

/** Sthan ka naam ya spelling sudhaarne (Update) karne ke liye */
export async function updateLocationName(formData: FormData) {
  if (!(await isAdmin())) return;

  const type = val(formData, 'locType'); // tehsil, samiti, gp, village, samitiWard, zilaWard
  const id = val(formData, 'locId');
  const nameHi = val(formData, 'nameHi');
  const nameEn = val(formData, 'nameEn');
  let message = '';

  if (!id || !nameHi) {
    message = 'स्थान की आईडी और नया हिंदी नाम दर्ज करना अनिवार्य है।';
    finish('loc', message);
  }

  try {
    if (type === 'tehsil') {
      await db.tehsil.update({ where: { id }, data: { nameHi, nameEn: nameEn || nameHi } });
    } else if (type === 'samiti') {
      await db.panchayatSamiti.update({ where: { id }, data: { nameHi, nameEn: nameEn || nameHi } });
    } else if (type === 'gp') {
      await db.gramPanchayat.update({ where: { id }, data: { nameHi, nameEn: nameEn || nameHi } });
    } else if (type === 'village') {
      await db.village.update({ where: { id }, data: { nameHi, nameEn: nameEn || nameHi } });
    } else if (type === 'samitiWard') {
      await db.samitiWard.update({ where: { id }, data: { nameHi } });
    } else if (type === 'zilaWard') {
      await db.zilaParishadWard.update({ where: { id }, data: { nameHi } });
    }

    message = 'स्थान का नाम सफलतापूर्वक सुधार/अपडेट कर दिया गया है।';
  } catch (error) {
    console.error('नाम अपडेट त्रुटि:', error);
    message = 'नाम अपडेट करने में त्रुटि हुई।';
  }

  finish('loc', message);
}