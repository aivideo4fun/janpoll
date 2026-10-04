import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

type LocationData = {
  districts: {
    nameEn: string;
    nameHi: string;

    tehsils: {
      nameEn: string;
      nameHi: string;

      panchayatSamitis: {
        nameEn: string;
        nameHi: string;

        gramPanchayats: {
          nameEn: string;
          nameHi: string;
        }[];
      }[];
    }[];
  }[];
};

async function main() {
  console.log('');
  console.log('🇮🇳 Rajasthan Location Master Seeding Started...');
  console.log('');

  const filePath = path.join(
    process.cwd(),
    'prisma',
    'data',
    'rajasthan-locations.json'
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Location data file nahi mili:\n${filePath}`
    );
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');

  const data: LocationData = JSON.parse(rawData);

  let districtCount = 0;
  let tehsilCount = 0;
  let samitiCount = 0;
  let gramPanchayatCount = 0;

  for (const district of data.districts) {
    console.log(`📍 District: ${district.nameEn}`);

    const districtRecord = await prisma.district.upsert({
      where: {
        nameEn: district.nameEn,
      },
      update: {
        nameHi: district.nameHi,
      },
      create: {
        nameEn: district.nameEn,
        nameHi: district.nameHi,
      },
    });

    districtCount++;

    for (const tehsil of district.tehsils) {
      const tehsilRecord = await prisma.tehsil.upsert({
        where: {
          districtId_nameEn: {
            districtId: districtRecord.id,
            nameEn: tehsil.nameEn,
          },
        },
        update: {
          nameHi: tehsil.nameHi,
        },
        create: {
          nameEn: tehsil.nameEn,
          nameHi: tehsil.nameHi,
          districtId: districtRecord.id,
        },
      });

      tehsilCount++;

      for (const samiti of tehsil.panchayatSamitis) {
        const samitiRecord =
          await prisma.panchayatSamiti.upsert({
            where: {
              districtId_nameEn: {
                districtId: districtRecord.id,
                nameEn: samiti.nameEn,
              },
            },
            update: {
              nameHi: samiti.nameHi,
              tehsilId: tehsilRecord.id,
            },
            create: {
              nameEn: samiti.nameEn,
              nameHi: samiti.nameHi,
              districtId: districtRecord.id,
              tehsilId: tehsilRecord.id,
            },
          });

        samitiCount++;

        for (const gp of samiti.gramPanchayats) {
          await prisma.gramPanchayat.upsert({
            where: {
              samitiId_nameEn: {
                samitiId: samitiRecord.id,
                nameEn: gp.nameEn,
              },
            },
            update: {
              nameHi: gp.nameHi,
              districtId: districtRecord.id,
            },
            create: {
              nameEn: gp.nameEn,
              nameHi: gp.nameHi,
              districtId: districtRecord.id,
              samitiId: samitiRecord.id,
            },
          });

          gramPanchayatCount++;
        }
      }
    }
  }

  console.log('');
  console.log('======================================');
  console.log('✅ Rajasthan Location Seeding Complete');
  console.log('======================================');
  console.log(`Districts          : ${districtCount}`);
  console.log(`Tehsils            : ${tehsilCount}`);
  console.log(`Panchayat Samitis  : ${samitiCount}`);
  console.log(`Gram Panchayats    : ${gramPanchayatCount}`);
  console.log('======================================');
  console.log('');
}

main()
  .catch((error) => {
    console.error('');
    console.error('❌ SEEDING ERROR');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });