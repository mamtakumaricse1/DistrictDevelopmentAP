import { createHash } from 'node:crypto';
import { LocationType, Prisma, PrismaClient } from '../src/generated/prisma';
import {
  CIRCLE_COORDINATES,
  OFFICIAL_BLOCKS,
  OFFICIAL_CIRCLES,
  OFFICIAL_DEPARTMENTS,
  RETIRED_SAMPLE_VILLAGE_IDS,
  SUBDIVISIONS,
} from './changlang-official-data';

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

function stableLocationId(kind: string, code: string): string {
  const hex = createHash('sha256').update(`changlang-location:${kind}:${code}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

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

async function saveLocation(input: {
  type: LocationType;
  code: string;
  name: string;
  parentId?: string | null;
  legacyId?: string;
  villageCount?: number;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const data = {
    type: input.type,
    code: input.code,
    name: input.name,
    parentId: input.parentId ?? null,
    villageCount: input.villageCount ?? null,
    latitude:
      input.latitude === undefined ? undefined : input.latitude === null ? null : new Prisma.Decimal(input.latitude),
    longitude:
      input.longitude === undefined ? undefined : input.longitude === null ? null : new Prisma.Decimal(input.longitude),
    isActive: true,
  };
  if (input.legacyId) {
    const byId = await prisma.location.findUnique({ where: { id: input.legacyId } });
    if (byId) {
      return prisma.location.update({ where: { id: input.legacyId }, data });
    }
  }
  const existing = await prisma.location.findUnique({
    where: { districtId_type_code: { districtId: CHANGLANG, type: input.type, code: input.code } },
  });
  if (existing) {
    return prisma.location.update({ where: { id: existing.id }, data });
  }
  return prisma.location.create({
    data: {
      id: input.legacyId ?? stableLocationId(input.type, input.code),
      districtId: CHANGLANG,
      ...data,
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
    ...OFFICIAL_DEPARTMENTS,
    { code: 'SW', name: 'Social Welfare', shortName: 'SW', hodName: 'CDPO' },
  ];

  for (const department of departmentDefs) {
    const id = CHANGLANG_DEPTS[department.code] ?? stableLocationId('DEPARTMENT', department.code);
    const existing = await prisma.department.findUnique({
      where: { districtId_code: { districtId: changlang.id, code: department.code } },
    });
    if (existing) {
      await prisma.department.update({
        where: { id: existing.id },
        data: {
          name: department.name,
          shortName: department.shortName ?? null,
          hodName: department.hodName ?? null,
          isActive: true,
        },
      });
    } else {
      await prisma.department.create({
        data: {
          id,
          districtId: changlang.id,
          code: department.code,
          name: department.name,
          shortName: department.shortName,
          hodName: department.hodName,
        },
      });
    }
  }

  const subdivisionIds = new Map<string, string>();
  for (const subdivision of SUBDIVISIONS) {
    const saved = await saveLocation({
      type: LocationType.SUB_DIVISION,
      code: subdivision.code,
      name: subdivision.name,
    });
    subdivisionIds.set(subdivision.code, saved.id);
  }

  const blockIds = new Map<string, string>();
  for (const block of OFFICIAL_BLOCKS) {
    const saved = await saveLocation({
      type: LocationType.BLOCK,
      code: block.code,
      name: block.name,
      parentId: subdivisionIds.get(block.subdivision) ?? null,
      legacyId: block.legacyId,
      latitude: null,
      longitude: null,
    });
    blockIds.set(block.code, saved.id);
  }

  for (const circle of OFFICIAL_CIRCLES) {
    const parentId = (circle.block ? blockIds.get(circle.block) : subdivisionIds.get(circle.subdivision)) ?? null;
    await saveLocation({
      type: LocationType.CIRCLE,
      code: circle.code,
      name: circle.name,
      parentId,
      legacyId: circle.legacyId,
      villageCount: circle.villages,
    });
  }

  for (const [name, coordinates] of Object.entries(CIRCLE_COORDINATES)) {
    await prisma.location.updateMany({
      where: { districtId: CHANGLANG, type: LocationType.CIRCLE, name },
      data: {
        latitude: new Prisma.Decimal(coordinates.latitude),
        longitude: new Prisma.Decimal(coordinates.longitude),
      },
    });
  }

  await prisma.location.updateMany({
    where: { id: { in: RETIRED_SAMPLE_VILLAGE_IDS } },
    data: { isActive: false, latitude: null, longitude: null },
  });

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
