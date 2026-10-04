import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Rajasthan hierarchy data seeding shuru ho rahi hai...');

  // 1. District Example: Jaipur
  const jaipur = await prisma.district.upsert({
    where: { nameEn: 'Jaipur' },
    update: {},
    create: {
      nameEn: 'Jaipur',
      nameHi: 'जयपुर',
      mandals: {
        create: [
          {
            nameEn: 'Amer',
            nameHi: 'आमेर',
            gramPanchayats: {
              create: [
                { nameEn: 'Kunda', nameHi: 'कुंडा', districtId: '', samitiId: '' }, // Note: Relations Prisma handle karega
              ],
            },
          },
          {
            nameEn: 'Jalsu',
            nameHi: 'जालसू',
          },
        ],
      },
    },
  });

  // 2. District Example: Jodhpur
  await prisma.district.upsert({
    where: { nameEn: 'Jodhpur' },
    update: {},
    create: {
      nameEn: 'Jodhpur',
      nameHi: 'जोधपुर',
      mandals: {
        create: [
          { nameEn: 'Osian', nameHi: 'ओसियां' },
          { nameEn: 'Bhopalgarh', nameHi: 'भोपालगढ़' },
        ],
      },
    },
  });

  console.log('✅ Sabhi districts aur mandals successfully seed ho gaye hain!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding mein error aayi hai:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });