import { LocationType, PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

const CHANGLANG = '11111111-1111-1111-1111-111111111111';

const CHANGLANG_DEPTS: Record<string, string> = {
  PWD: '33333333-3333-3333-3333-333333333333',
  EDU: '33333333-3333-3333-3333-333333333334',
  HLT: '33333333-3333-3333-3333-333333333335',
  PHED: '33333333-3333-3333-3333-333333333336',
  RD: '33333333-3333-3333-3333-333333333337',
  RWD: '33333333-3333-3333-3333-333333333338',
  AGR: '33333333-3333-3333-3333-333333333339',
  SW: '33333333-3333-3333-3333-33333333333a',
  UD: '33333333-3333-3333-3333-33333333333b',
  FCS: '33333333-3333-3333-3333-33333333333c',
  TRN: '33333333-3333-3333-3333-33333333333d',
  PWR: '33333333-3333-3333-3333-33333333333e',
};

const BLOCKS: Array<{
  id: string;
  code: string;
  name: string;
  population: number;
  latitude: number;
  longitude: number;
}> = [
  { id: '44444444-4444-4444-4444-000000000001', code: 'CHANGLANG', name: 'Changlang', population: 28000, latitude: 27.14, longitude: 95.734 },
  { id: '44444444-4444-4444-4444-000000000002', code: 'MIAO', name: 'Miao', population: 22000, latitude: 27.2, longitude: 96.2 },
  { id: '44444444-4444-4444-4444-000000000003', code: 'JAIRAMPUR', name: 'Jairampur', population: 18000, latitude: 27.3, longitude: 96.0 },
  { id: '44444444-4444-4444-4444-000000000004', code: 'NAMPONG', name: 'Nampong', population: 12000, latitude: 27.28, longitude: 96.11 },
  { id: '44444444-4444-4444-4444-000000000005', code: 'KHIMYANG', name: 'Khimyang', population: 14000, latitude: 27.05, longitude: 95.85 },
  { id: '44444444-4444-4444-4444-000000000006', code: 'BORDUMSA', name: 'Bordumsa', population: 16000, latitude: 27.5, longitude: 95.9 },
  { id: '44444444-4444-4444-4444-000000000007', code: 'DIYUN', name: 'Diyun', population: 15000, latitude: 27.55, longitude: 96.05 },
  { id: '44444444-4444-4444-4444-000000000008', code: 'KHARSANG', name: 'Kharsang', population: 13226, latitude: 27.42, longitude: 96.05 },
];

const VILLAGES: Array<{ id: string; parentCode: string; code: string; name: string; population: number }> = [
  { id: '44444444-4444-4444-4444-000000000101', parentCode: 'CHANGLANG', code: 'CHANGLANG_HQ', name: 'Changlang HQ', population: 9800 },
  { id: '44444444-4444-4444-4444-000000000102', parentCode: 'CHANGLANG', code: 'RIMA', name: 'Rima', population: 2100 },
  { id: '44444444-4444-4444-4444-000000000103', parentCode: 'MIAO', code: 'MIAO_TOWN', name: 'Miao', population: 7200 },
  { id: '44444444-4444-4444-4444-000000000104', parentCode: 'MIAO', code: 'NAMPHAI', name: 'Namphai', population: 1800 },
  { id: '44444444-4444-4444-4444-000000000105', parentCode: 'JAIRAMPUR', code: 'JAIRAMPUR_TOWN', name: 'Jairampur', population: 6100 },
  { id: '44444444-4444-4444-4444-000000000106', parentCode: 'JAIRAMPUR', code: 'NONGTHEY', name: 'Nongthey', population: 1400 },
  { id: '44444444-4444-4444-4444-000000000107', parentCode: 'NAMPONG', code: 'NAMPONG_TOWN', name: 'Nampong', population: 3200 },
  { id: '44444444-4444-4444-4444-000000000108', parentCode: 'KHIMYANG', code: 'KHIMYANG_HQ', name: 'Khimyang', population: 2600 },
];

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
  population?: number;
}) {
  return prisma.district.upsert({
    where: { code: input.code },
    update: {
      name: input.name,
      stateCode: 'AR',
      stateName: 'Arunachal Pradesh',
      headquarters: input.headquarters,
      population: input.population,
      keycloakRealm: input.realm,
      keycloakIssuer: issuerFor(input.realm),
      isActive: true,
    },
    create: {
      id: input.id,
      code: input.code,
      name: input.name,
      stateCode: 'AR',
      stateName: 'Arunachal Pradesh',
      headquarters: input.headquarters,
      population: input.population,
      keycloakRealm: input.realm,
      keycloakIssuer: issuerFor(input.realm),
      isActive: true,
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
    population: 148226,
  });
  await prisma.district.updateMany({
    where: { code: 'TIRAP' },
    data: { isActive: false },
  });

  const departmentDefs = [
    { code: 'PWD', name: 'Public Works Department', shortName: 'PWD', hodName: 'EE PWD', hodContact: 'ee.pwd@changlang.gov.in' },
    { code: 'RWD', name: 'Rural Works Department', shortName: 'RWD', hodName: 'EE RWD', hodContact: 'ee.rwd@changlang.gov.in' },
    { code: 'PHED', name: 'Public Health Engineering', shortName: 'PHED', hodName: 'EE PHED', hodContact: 'ee.phed@changlang.gov.in' },
    { code: 'EDU', name: 'Education', shortName: 'Education', hodName: 'DEO', hodContact: 'deo@changlang.gov.in' },
    { code: 'HLT', name: 'Health', shortName: 'Health', hodName: 'DMO', hodContact: 'dmo@changlang.gov.in' },
    { code: 'RD', name: 'Rural Development', shortName: 'RD', hodName: 'PD DRDA', hodContact: 'pd.drda@changlang.gov.in' },
    { code: 'AGR', name: 'Agriculture', shortName: 'Agriculture', hodName: 'DAO', hodContact: 'dao@changlang.gov.in' },
    { code: 'SW', name: 'Social Welfare', shortName: 'SW', hodName: 'CDPO', hodContact: 'cdpo@changlang.gov.in' },
    { code: 'UD', name: 'Urban Development', shortName: 'UD', hodName: 'DUDA', hodContact: 'duda@changlang.gov.in' },
    { code: 'FCS', name: 'Food & Civil Supply', shortName: 'FCS', hodName: 'DFCS', hodContact: 'dfcs@changlang.gov.in' },
    { code: 'TRN', name: 'Transport', shortName: 'Transport', hodName: 'DTO', hodContact: 'dto@changlang.gov.in' },
    { code: 'PWR', name: 'Power', shortName: 'Power', hodName: 'EE Power', hodContact: 'ee.power@changlang.gov.in' },
  ];

  for (const district of [changlang]) {
    for (const department of departmentDefs) {
      const id = CHANGLANG_DEPTS[department.code];
      const existing = await prisma.department.findUnique({
        where: { districtId_code: { districtId: district.id, code: department.code } },
      });
      if (existing) {
        await prisma.department.update({
          where: { id: existing.id },
          data: {
            name: department.name,
            shortName: department.shortName,
            hodName: department.hodName,
            hodContact: department.hodContact,
          },
        });
      } else {
        await prisma.department.create({
          data: { id, districtId: district.id, ...department },
        });
      }
    }
  }

  for (const block of BLOCKS) {
    await prisma.location.upsert({
      where: {
        districtId_type_code: { districtId: CHANGLANG, type: LocationType.BLOCK, code: block.code },
      },
      update: {
        name: block.name,
        population: block.population,
        latitude: block.latitude,
        longitude: block.longitude,
        isActive: true,
      },
      create: {
        id: block.id,
        districtId: CHANGLANG,
        type: LocationType.BLOCK,
        code: block.code,
        name: block.name,
        population: block.population,
        latitude: block.latitude,
        longitude: block.longitude,
      },
    });
  }

  const blockByCode = new Map(BLOCKS.map((block) => [block.code, block]));
  for (const [index, village] of VILLAGES.entries()) {
    const parent = blockByCode.get(village.parentCode);
    if (!parent) {
      continue;
    }
    const latitude = parent.latitude + ((index % 2 === 0 ? 1 : -1) * 0.018);
    const longitude = parent.longitude + 0.022;
    await prisma.location.upsert({
      where: {
        districtId_type_code: { districtId: CHANGLANG, type: LocationType.VILLAGE, code: village.code },
      },
      update: {
        name: village.name,
        population: village.population,
        parentId: parent.id,
        latitude,
        longitude,
        isActive: true,
      },
      create: {
        id: village.id,
        districtId: CHANGLANG,
        parentId: parent.id,
        type: LocationType.VILLAGE,
        code: village.code,
        name: village.name,
        population: village.population,
        latitude,
        longitude,
      },
    });
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
    { key: 'rag.green_threshold', value: '90', valueType: 'STRING' },
    { key: 'rag.amber_threshold', value: '70', valueType: 'STRING' },
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
