import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Rajasthan hierarchy data seeding shuru ho rahi hai...');

  // 1. Pehle District banayein ya upsert karein
  const jaipur = await prisma.district.upsert({
    where: { nameEn: 'Jaipur' },
    update: {},
    create: {
      nameEn: 'Jaipur',
      nameHi: 'जयपुर',
    },
  });

  // 2. Us District ke antargat Panchayat Samiti (Mandal) banayein
  const amerSamiti = await prisma.panchayatSamiti.upsert({
    where: { 
      // Agar nameEn unique nahi hai toh districtId ke sath check karne ke liye id use hoti hai, 
      // par yahan hum simple create/upsert rakhte hain:
      id: 'jaipur-amer-samiti' // ya koi bhi unique identifier ya check
    },
    update: {},
    create: {
      id: 'jaipur-amer-samiti',
      nameEn: 'Amer',
      nameHi: 'आमेर',
      districtId: jaipur.id,
    },
  }).catch(async () => {
    // Agar id se error aaye toh find karke update/create kar lein
    return await prisma.panchayatSamiti.create({
      data: {
        nameEn: 'Amer',
        nameHi: 'आमेर',
        districtId: jaipur.id,
      }
    });
  });

  // 3. Gram Panchayat banayein jisme districtId aur samitiId dono diye gaye hon
  await prisma.gramPanchayat.create({
    data: {
      nameEn: 'Kunda',
      nameHi: 'कुंडा',
      districtId: jaipur.id,
      samitiId: amerSamiti.id,
    },
  }).catch(() => {
    console.log('Gram panchayat pehle se mojood ho sakti hai.');
  });

  console.log('✅ Seeding successfully poori ho gayi hai!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding mein error aayi hai:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });