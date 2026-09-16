import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

const CHANGLANG = '11111111-1111-1111-1111-111111111111';
const TIRAP = '22222222-2222-2222-2222-222222222222';
const CHANGLANG_PWD = '33333333-3333-3333-3333-333333333333';
const TIRAP_PWD = '55555555-5555-5555-5555-555555555555';

function issuerFor(realm: string): string {
  const base = (process.env.KEYCLOAK_URL ?? 'http://localhost:8080').replace(/\/+$/, '');
  return `${base}/realms/${realm}`;
}

async function upsertDistrict(input: {
  id: string;
  code: string;
  name: string;
  headquarters: string;
  realm: string;
}) {
  return prisma.district.upsert({
    where: { code: input.code },
    update: {
      name: input.name,
      stateCode: 'AR',
      stateName: 'Arunachal Pradesh',
      headquarters: input.headquarters,
      keycloakRealm: input.realm,
      keycloakIssuer: issuerFor(input.realm),
    },
    create: {
      id: input.id,
      code: input.code,
      name: input.name,
      stateCode: 'AR',
      stateName: 'Arunachal Pradesh',
      headquarters: input.headquarters,
      keycloakRealm: input.realm,
      keycloakIssuer: issuerFor(input.realm),
    },
  });
}

async function main(): Promise<void> {
  const changlang = await upsertDistrict({
    id: CHANGLANG,
    code: 'CHANGLANG',
    name: 'Changlang',
    headquarters: 'Changlang',
    realm: 'changlang',
  });
  const tirap = await upsertDistrict({
    id: TIRAP,
    code: 'TIRAP',
    name: 'Tirap',
    headquarters: 'Khonsa',
    realm: 'tirap',
  });

  const departmentDefs = [
    { code: 'PWD', name: 'Public Works Department', shortName: 'PWD' },
    { code: 'EDU', name: 'Education', shortName: 'Education' },
    { code: 'HLT', name: 'Health', shortName: 'Health' },
    { code: 'PHED', name: 'Public Health Engineering', shortName: 'PHED' },
    { code: 'RD', name: 'Rural Development', shortName: 'RD' },
  ];

  for (const district of [changlang, tirap]) {
    for (const department of departmentDefs) {
      const id =
        district.id === CHANGLANG && department.code === 'PWD'
          ? CHANGLANG_PWD
          : district.id === TIRAP && department.code === 'PWD'
            ? TIRAP_PWD
            : undefined;
      const existing = await prisma.department.findUnique({
        where: { districtId_code: { districtId: district.id, code: department.code } },
      });
      if (existing) {
        await prisma.department.update({
          where: { id: existing.id },
          data: { name: department.name, shortName: department.shortName },
        });
      } else {
        await prisma.department.create({
          data: { id, districtId: district.id, ...department },
        });
      }
    }
  }

  const masterCategories = [
    { code: 'DOCUMENT_CATEGORY', name: 'Document category' },
    { code: 'DELAY_REASON', name: 'Delay reason' },
    { code: 'WORK_CATEGORY', name: 'Work category' },
  ];
  for (const category of masterCategories) {
    const saved = await prisma.masterDataCategory.upsert({
      where: { code: category.code },
      update: { name: category.name },
      create: category,
    });
    if (category.code === 'DOCUMENT_CATEGORY') {
      const defaults = [
        { code: 'SANCTION', name: 'Sanction order', sortOrder: 1 },
        { code: 'PHOTO', name: 'Site photograph', sortOrder: 2 },
        { code: 'UC', name: 'Utilization certificate', sortOrder: 3 },
      ];
      for (const item of defaults) {
        const existing = await prisma.masterDataItem.findFirst({
          where: { categoryId: saved.id, districtId: null, code: item.code },
        });
        if (!existing) {
          await prisma.masterDataItem.create({
            data: { categoryId: saved.id, districtId: null, ...item },
          });
        }
      }
    }
  }

  const globalSettings: Array<{ key: string; value: string; valueType: 'STRING' }> = [
    { key: 'project.code_pattern', value: '{DISTRICT}-{DEPT}-{FY}-{seq}', valueType: 'STRING' },
    { key: 'reporting.period_kind', value: 'calendar_month', valueType: 'STRING' },
    { key: 'storage.root', value: '/var/dashboard/storage', valueType: 'STRING' },
  ];
  for (const setting of globalSettings) {
    const existing = await prisma.systemSetting.findFirst({
      where: { districtId: null, key: setting.key },
    });
    if (existing) {
      await prisma.systemSetting.update({
        where: { id: existing.id },
        data: { value: setting.value, valueType: setting.valueType },
      });
    } else {
      await prisma.systemSetting.create({
        data: { districtId: null, key: setting.key, value: setting.value, valueType: setting.valueType },
      });
    }
  }

  console.log('Organization seed complete.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
