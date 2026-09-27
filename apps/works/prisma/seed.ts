import {
  PrismaClient,
  ProgressStatus,
  ProjectCategory,
  ProjectStatus,
  SchemeDomain,
  SchemeFunding,
  WorkType,
} from '../src/generated/prisma';

const prisma = new PrismaClient();

const CHANGLANG = '11111111-1111-1111-1111-111111111111';
const PWD = '33333333-3333-3333-3333-333333333333';
const EDU = '33333333-3333-3333-3333-333333333334';
const HLT = '33333333-3333-3333-3333-333333333335';
const PHED = '33333333-3333-3333-3333-333333333336';
const RD = '33333333-3333-3333-3333-333333333337';
const RWD = '33333333-3333-3333-3333-333333333338';
const AGR = '33333333-3333-3333-3333-333333333339';
const SW = '33333333-3333-3333-3333-33333333333a';
const UD = '33333333-3333-3333-3333-33333333333b';
const FCS = '33333333-3333-3333-3333-33333333333c';
const TRN = '33333333-3333-3333-3333-33333333333d';
const PWR = '33333333-3333-3333-3333-33333333333e';

const BLOCK_CHANGLANG = '44444444-4444-4444-4444-000000000001';
const BLOCK_MIAO = '44444444-4444-4444-4444-000000000002';
const BLOCK_JAIRAMPUR = '44444444-4444-4444-4444-000000000003';
const BLOCK_NAMPONG = '44444444-4444-4444-4444-000000000004';
const BLOCK_KHIMYANG = '44444444-4444-4444-4444-000000000005';

const SCHEMES = {
  JJM: '66666666-6666-6666-6666-666666666601',
  PMAY: '66666666-6666-6666-6666-666666666602',
  MGNREGA: '66666666-6666-6666-6666-666666666603',
  PMKISAN: '66666666-6666-6666-6666-666666666604',
  NSAP: '66666666-6666-6666-6666-666666666605',
  SCHOOL: '66666666-6666-6666-6666-666666666606',
  NHM: '66666666-6666-6666-6666-666666666607',
  PMGSY: '66666666-6666-6666-6666-666666666608',
  PMAY_U: '66666666-6666-6666-6666-666666666609',
  NFSA: '66666666-6666-6666-6666-666666666610',
  DLIMS: '66666666-6666-6666-6666-666666666611',
  SAUBHAGYA: '66666666-6666-6666-6666-666666666612',
} as const;

const KPIS = {
  JJM: '77777777-7777-7777-7777-777777777701',
  PMAY: '77777777-7777-7777-7777-777777777702',
  MGNREGA: '77777777-7777-7777-7777-777777777703',
  PMKISAN: '77777777-7777-7777-7777-777777777704',
  NSAP: '77777777-7777-7777-7777-777777777705',
  SCHOOL: '77777777-7777-7777-7777-777777777706',
  NHM: '77777777-7777-7777-7777-777777777707',
  PMGSY: '77777777-7777-7777-7777-777777777708',
  PMAY_U: '77777777-7777-7777-7777-777777777709',
  NFSA: '77777777-7777-7777-7777-777777777710',
  DLIMS: '77777777-7777-7777-7777-777777777711',
  SAUBHAGYA: '77777777-7777-7777-7777-777777777712',
} as const;

const ACTOR = '11111111-1111-1111-1111-aaaaaaaaaaa1';

async function upsertScheme(input: {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  funding: SchemeFunding;
  domain: SchemeDomain;
  officerName: string;
  targetValue: number;
  targetUnit: string;
  kpiId: string;
  kpiName: string;
  unit: string;
  periodYm: string;
  achievement: number;
  physical: number;
  financial: number;
  allocated: number;
  released: number;
  expenditure: number;
}) {
  await prisma.scheme.upsert({
    where: { districtId_code: { districtId: CHANGLANG, code: input.code } },
    update: { name: input.name, officerName: input.officerName, isActive: true },
    create: {
      id: input.id,
      districtId: CHANGLANG,
      departmentId: input.departmentId,
      code: input.code,
      name: input.name,
      funding: input.funding,
      domain: input.domain,
      officerName: input.officerName,
      targetValue: input.targetValue,
      targetUnit: input.targetUnit,
    },
  });
  await prisma.schemeKpi.upsert({
    where: { id: input.kpiId },
    update: { name: input.kpiName, target: input.targetValue },
    create: {
      id: input.kpiId,
      schemeId: input.id,
      name: input.kpiName,
      unit: input.unit,
      target: input.targetValue,
    },
  });
  await prisma.schemeProgress.upsert({
    where: { kpiId_periodYm: { kpiId: input.kpiId, periodYm: input.periodYm } },
    update: {
      achievement: input.achievement,
      physicalPercent: input.physical,
      financialPercent: input.financial,
      fundAllocated: input.allocated,
      fundReleased: input.released,
      expenditure: input.expenditure,
    },
    create: {
      kpiId: input.kpiId,
      periodYm: input.periodYm,
      target: input.targetValue,
      achievement: input.achievement,
      physicalPercent: input.physical,
      financialPercent: input.financial,
      fundAllocated: input.allocated,
      fundReleased: input.released,
      expenditure: input.expenditure,
      createdById: ACTOR,
    },
  });
}

async function main(): Promise<void> {
  await prisma.projectSequence.upsert({
    where: { districtId_departmentId_year: { districtId: CHANGLANG, departmentId: PWD, year: 2026 } },
    update: { lastValue: 6 },
    create: { districtId: CHANGLANG, departmentId: PWD, year: 2026, lastValue: 6 },
  });
  await upsertScheme({
    id: SCHEMES.JJM,
    departmentId: PHED,
    code: 'JJM',
    name: 'Jal Jeevan Mission',
    funding: SchemeFunding.CENTRAL,
    domain: SchemeDomain.WATER,
    officerName: 'EE PHED',
    targetValue: 25000,
    targetUnit: 'households',
    kpiId: KPIS.JJM,
    kpiName: 'FHTC Provided',
    unit: 'households',
    periodYm: '2026-09',
    achievement: 21500,
    physical: 86,
    financial: 72,
    allocated: 180,
    released: 140,
    expenditure: 129.6,
  });
  await upsertScheme({
    id: SCHEMES.PMAY,
    departmentId: RD,
    code: 'PMAY',
    name: 'PMAY-G',
    funding: SchemeFunding.CENTRAL,
    domain: SchemeDomain.HOUSING,
    officerName: 'PD DRDA',
    targetValue: 5000,
    targetUnit: 'houses',
    kpiId: KPIS.PMAY,
    kpiName: 'Houses completed',
    unit: 'houses',
    periodYm: '2026-09',
    achievement: 3400,
    physical: 68,
    financial: 61,
    allocated: 90,
    released: 70,
    expenditure: 54.9,
  });
  await upsertScheme({
    id: SCHEMES.MGNREGA,
    departmentId: RD,
    code: 'MGNREGA',
    name: 'MGNREGA',
    funding: SchemeFunding.CENTRAL,
    domain: SchemeDomain.EMPLOYMENT,
    officerName: 'PD DRDA',
    targetValue: 50000,
    targetUnit: 'persondays',
    kpiId: KPIS.MGNREGA,
    kpiName: 'Persondays generated',
    unit: 'days',
    periodYm: '2026-09',
    achievement: 38000,
    physical: 76,
    financial: 74,
    allocated: 45,
    released: 40,
    expenditure: 33.3,
  });
  await upsertScheme({
    id: SCHEMES.PMKISAN,
    departmentId: AGR,
    code: 'PMKISAN',
    name: 'PM-KISAN',
    funding: SchemeFunding.CENTRAL,
    domain: SchemeDomain.AGRICULTURE,
    officerName: 'DAO',
    targetValue: 18000,
    targetUnit: 'farmers',
    kpiId: KPIS.PMKISAN,
    kpiName: 'Farmers paid',
    unit: 'farmers',
    periodYm: '2026-09',
    achievement: 16400,
    physical: 91,
    financial: 91,
    allocated: 36,
    released: 36,
    expenditure: 32.8,
  });
  await upsertScheme({
    id: SCHEMES.NSAP,
    departmentId: SW,
    code: 'NSAP',
    name: 'NSAP pensions',
    funding: SchemeFunding.CENTRAL,
    domain: SchemeDomain.SOCIAL_WELFARE,
    officerName: 'CDPO',
    targetValue: 8500,
    targetUnit: 'pensioners',
    kpiId: KPIS.NSAP,
    kpiName: 'Pensions disbursed',
    unit: 'persons',
    periodYm: '2026-09',
    achievement: 7900,
    physical: 93,
    financial: 90,
    allocated: 12,
    released: 12,
    expenditure: 10.8,
  });
  await upsertScheme({
    id: SCHEMES.SCHOOL,
    departmentId: EDU,
    code: 'SCHOOL-INFRA',
    name: 'School infrastructure',
    funding: SchemeFunding.STATE,
    domain: SchemeDomain.EDUCATION,
    officerName: 'DEO',
    targetValue: 120,
    targetUnit: 'schools',
    kpiId: KPIS.SCHOOL,
    kpiName: 'Schools upgraded',
    unit: 'schools',
    periodYm: '2026-09',
    achievement: 95,
    physical: 79,
    financial: 71,
    allocated: 28,
    released: 22,
    expenditure: 19.9,
  });
  await upsertScheme({
    id: SCHEMES.NHM,
    departmentId: HLT,
    code: 'NHM',
    name: 'National Health Mission',
    funding: SchemeFunding.CSS,
    domain: SchemeDomain.HEALTH,
    officerName: 'DMO',
    targetValue: 100,
    targetUnit: 'percent',
    kpiId: KPIS.NHM,
    kpiName: 'Institutional deliveries',
    unit: 'percent',
    periodYm: '2026-09',
    achievement: 88,
    physical: 88,
    financial: 81,
    allocated: 20,
    released: 18,
    expenditure: 16.2,
  });
  await upsertScheme({
    id: SCHEMES.PMGSY,
    departmentId: RWD,
    code: 'PMGSY',
    name: 'PMGSY roads',
    funding: SchemeFunding.CENTRAL,
    domain: SchemeDomain.INFRASTRUCTURE,
    officerName: 'EE RWD',
    targetValue: 40,
    targetUnit: 'km',
    kpiId: KPIS.PMGSY,
    kpiName: 'Road length completed',
    unit: 'km',
    periodYm: '2026-09',
    achievement: 29,
    physical: 72,
    financial: 64,
    allocated: 60,
    released: 48,
    expenditure: 38.4,
  });
  await upsertScheme({
    id: SCHEMES.PMAY_U,
    departmentId: UD,
    code: 'PMAY-U',
    name: 'PMAY Urban',
    funding: SchemeFunding.CENTRAL,
    domain: SchemeDomain.HOUSING,
    officerName: 'DUDA',
    targetValue: 800,
    targetUnit: 'houses',
    kpiId: KPIS.PMAY_U,
    kpiName: 'Houses completed',
    unit: 'houses',
    periodYm: '2026-09',
    achievement: 520,
    physical: 65,
    financial: 58,
    allocated: 24,
    released: 18,
    expenditure: 14,
  });
  await upsertScheme({
    id: SCHEMES.NFSA,
    departmentId: FCS,
    code: 'NFSA',
    name: 'NFSA ration cards',
    funding: SchemeFunding.CENTRAL,
    domain: SchemeDomain.SOCIAL_WELFARE,
    officerName: 'DFCS',
    targetValue: 28000,
    targetUnit: 'cards',
    kpiId: KPIS.NFSA,
    kpiName: 'Ration cards active',
    unit: 'cards',
    periodYm: '2026-09',
    achievement: 26100,
    physical: 93,
    financial: 90,
    allocated: 8,
    released: 8,
    expenditure: 7.2,
  });
  await upsertScheme({
    id: SCHEMES.DLIMS,
    departmentId: TRN,
    code: 'DLIMS',
    name: 'Driving licences issued',
    funding: SchemeFunding.STATE,
    domain: SchemeDomain.OTHER,
    officerName: 'DTO',
    targetValue: 2400,
    targetUnit: 'licences',
    kpiId: KPIS.DLIMS,
    kpiName: 'Licences issued',
    unit: 'licences',
    periodYm: '2026-09',
    achievement: 1880,
    physical: 78,
    financial: 70,
    allocated: 2,
    released: 1.6,
    expenditure: 1.4,
  });
  await upsertScheme({
    id: SCHEMES.SAUBHAGYA,
    departmentId: PWR,
    code: 'SAUBHAGYA',
    name: 'Village electrification',
    funding: SchemeFunding.CENTRAL,
    domain: SchemeDomain.INFRASTRUCTURE,
    officerName: 'EE Power',
    targetValue: 120,
    targetUnit: 'villages',
    kpiId: KPIS.SAUBHAGYA,
    kpiName: 'Villages electrified',
    unit: 'villages',
    periodYm: '2026-09',
    achievement: 104,
    physical: 87,
    financial: 81,
    allocated: 15,
    released: 12,
    expenditure: 12.2,
  });

  const blockShares: Array<{ locationId: string; jjm: number; pmay: number }> = [
    { locationId: BLOCK_CHANGLANG, jjm: 92, pmay: 74 },
    { locationId: BLOCK_MIAO, jjm: 88, pmay: 71 },
    { locationId: BLOCK_JAIRAMPUR, jjm: 74, pmay: 61 },
    { locationId: BLOCK_NAMPONG, jjm: 61, pmay: 55 },
    { locationId: BLOCK_KHIMYANG, jjm: 81, pmay: 69 },
  ];
  for (const share of blockShares) {
    await prisma.beneficiarySnapshot.upsert({
      where: { schemeId_locationId_periodYm: { schemeId: SCHEMES.JJM, locationId: share.locationId, periodYm: '2026-09' } },
      update: { beneficiaries: Math.round(25000 * (share.jjm / 100) * 0.2), target: 5000 },
      create: {
        schemeId: SCHEMES.JJM,
        locationId: share.locationId,
        periodYm: '2026-09',
        target: 5000,
        beneficiaries: Math.round(25000 * (share.jjm / 100) * 0.2),
      },
    });
    await prisma.beneficiarySnapshot.upsert({
      where: { schemeId_locationId_periodYm: { schemeId: SCHEMES.PMAY, locationId: share.locationId, periodYm: '2026-09' } },
      update: { beneficiaries: Math.round(1000 * (share.pmay / 100)), target: 1000 },
      create: {
        schemeId: SCHEMES.PMAY,
        locationId: share.locationId,
        periodYm: '2026-09',
        target: 1000,
        beneficiaries: Math.round(1000 * (share.pmay / 100)),
      },
    });
  }
  const sectorShares: Array<{ schemeId: string; locationId: string; target: number; beneficiaries: number }> = [
    { schemeId: SCHEMES.NHM, locationId: BLOCK_CHANGLANG, target: 100, beneficiaries: 91 },
    { schemeId: SCHEMES.NHM, locationId: BLOCK_JAIRAMPUR, target: 100, beneficiaries: 74 },
    { schemeId: SCHEMES.SCHOOL, locationId: BLOCK_KHIMYANG, target: 100, beneficiaries: 82 },
    { schemeId: SCHEMES.SCHOOL, locationId: BLOCK_MIAO, target: 100, beneficiaries: 88 },
    { schemeId: SCHEMES.MGNREGA, locationId: BLOCK_NAMPONG, target: 10000, beneficiaries: 6100 },
    { schemeId: SCHEMES.NSAP, locationId: BLOCK_CHANGLANG, target: 1700, beneficiaries: 1580 },
    { schemeId: SCHEMES.JJM, locationId: '44444444-4444-4444-4444-000000000106', target: 280, beneficiaries: 190 },
  ];
  for (const share of sectorShares) {
    await prisma.beneficiarySnapshot.upsert({
      where: { schemeId_locationId_periodYm: { schemeId: share.schemeId, locationId: share.locationId, periodYm: '2026-09' } },
      update: { beneficiaries: share.beneficiaries, target: share.target },
      create: {
        schemeId: share.schemeId,
        locationId: share.locationId,
        periodYm: '2026-09',
        target: share.target,
        beneficiaries: share.beneficiaries,
      },
    });
  }
  const districtJjm = await prisma.beneficiarySnapshot.findFirst({
    where: { schemeId: SCHEMES.JJM, locationId: null, periodYm: '2026-09' },
  });
  if (districtJjm) {
    await prisma.beneficiarySnapshot.update({
      where: { id: districtJjm.id },
      data: { beneficiaries: 21500, target: 25000, male: 10800, female: 10700 },
    });
  } else {
    await prisma.beneficiarySnapshot.create({
      data: {
        schemeId: SCHEMES.JJM,
        locationId: null,
        periodYm: '2026-09',
        target: 25000,
        beneficiaries: 21500,
        male: 10800,
        female: 10700,
      },
    });
  }

  await prisma.project.upsert({
    where: { code: 'CHANGLANG-PWD-2026-00001' },
    update: {
      name: 'Construction of Changlang HQ approach road',
      schemeId: SCHEMES.PMGSY,
      locationId: BLOCK_CHANGLANG,
      locationText: 'Changlang HQ approach',
      sanctionedAmount: 120000000,
      releasedAmount: 80000000,
      contractor: 'M/s Hill Roads',
      category: ProjectCategory.ROAD,
      workType: WorkType.PWD,
      expectedCompletion: new Date('2026-08-09'),
      startDate: new Date('2025-10-01'),
      isActive: true,
    },
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      code: 'CHANGLANG-PWD-2026-00001',
      name: 'Construction of Changlang HQ approach road',
      districtId: CHANGLANG,
      departmentId: PWD,
      schemeId: SCHEMES.PMGSY,
      locationId: BLOCK_CHANGLANG,
      financialYear: 2026,
      status: ProjectStatus.ACTIVE,
      sanctionedAmount: 120000000,
      releasedAmount: 80000000,
      contractor: 'M/s Hill Roads',
      category: ProjectCategory.ROAD,
      workType: WorkType.PWD,
      startDate: new Date('2025-04-01'),
      expectedCompletion: new Date('2026-08-09'),
      locationText: 'Changlang HQ approach',
    },
  });
  await prisma.project.upsert({
    where: { code: 'CHANGLANG-PHED-2026-00001' },
    update: {
      name: 'JJM village water supply — Nongthey',
      locationId: '44444444-4444-4444-4444-000000000106',
      expectedCompletion: new Date('2026-08-23'),
      isActive: true,
    },
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
      code: 'CHANGLANG-PHED-2026-00001',
      name: 'JJM village water supply — Nongthey',
      districtId: CHANGLANG,
      departmentId: PHED,
      schemeId: SCHEMES.JJM,
      locationId: '44444444-4444-4444-4444-000000000106',
      financialYear: 2026,
      status: ProjectStatus.ACTIVE,
      sanctionedAmount: 45000000,
      releasedAmount: 22000000,
      contractor: 'M/s Eastern Water',
      category: ProjectCategory.WATER,
      expectedCompletion: new Date('2026-08-23'),
      locationText: 'Nongthey, Jairampur',
    },
  });
  await prisma.project.upsert({
    where: { code: 'CHANGLANG-EDU-2026-00001' },
    update: {
      name: 'School building — Khimyang',
      expectedCompletion: new Date('2026-08-30'),
      locationId: '44444444-4444-4444-4444-000000000108',
      isActive: true,
    },
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
      code: 'CHANGLANG-EDU-2026-00001',
      name: 'School building — Khimyang',
      districtId: CHANGLANG,
      departmentId: EDU,
      schemeId: SCHEMES.SCHOOL,
      locationId: BLOCK_KHIMYANG,
      financialYear: 2026,
      status: ProjectStatus.ACTIVE,
      sanctionedAmount: 18000000,
      releasedAmount: 9000000,
      category: ProjectCategory.BUILDING,
      expectedCompletion: new Date('2026-08-30'),
      locationText: 'Khimyang',
    },
  });
  await prisma.project.upsert({
    where: { code: 'CHANGLANG-NH-2026-00001' },
    update: {
      name: 'NH-215 strengthening — Miao',
      category: ProjectCategory.ROAD,
      workType: WorkType.NH,
      locationId: BLOCK_MIAO,
      expectedCompletion: new Date('2027-03-31'),
      isActive: true,
    },
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
      code: 'CHANGLANG-NH-2026-00001',
      name: 'NH-215 strengthening — Miao',
      districtId: CHANGLANG,
      departmentId: PWD,
      schemeId: SCHEMES.PMGSY,
      locationId: BLOCK_MIAO,
      financialYear: 2026,
      status: ProjectStatus.ACTIVE,
      sanctionedAmount: 210000000,
      releasedAmount: 150000000,
      contractor: 'M/s Frontier Highways',
      category: ProjectCategory.ROAD,
      workType: WorkType.NH,
      startDate: new Date('2025-11-01'),
      expectedCompletion: new Date('2027-03-31'),
      locationText: 'Miao',
    },
  });
  await prisma.project.upsert({
    where: { code: 'CHANGLANG-PWD-2026-00002' },
    update: {
      name: 'Nampong river bridge',
      category: ProjectCategory.BRIDGE,
      workType: WorkType.PWD,
      locationId: BLOCK_NAMPONG,
      expectedCompletion: new Date('2027-06-30'),
      isActive: true,
    },
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
      code: 'CHANGLANG-PWD-2026-00002',
      name: 'Nampong river bridge',
      districtId: CHANGLANG,
      departmentId: PWD,
      locationId: BLOCK_NAMPONG,
      financialYear: 2026,
      status: ProjectStatus.ACTIVE,
      sanctionedAmount: 85000000,
      releasedAmount: 40000000,
      contractor: 'M/s Eastern Spans',
      category: ProjectCategory.BRIDGE,
      workType: WorkType.PWD,
      startDate: new Date('2026-01-15'),
      expectedCompletion: new Date('2027-06-30'),
      locationText: 'Nampong',
    },
  });
  await prisma.project.upsert({
    where: { code: 'CHANGLANG-RWD-2026-00001' },
    update: {
      name: 'Jairampur market culvert',
      category: ProjectCategory.CULVERT,
      workType: WorkType.RWD,
      locationId: BLOCK_JAIRAMPUR,
      expectedCompletion: new Date('2026-12-15'),
      isActive: true,
    },
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
      code: 'CHANGLANG-RWD-2026-00001',
      name: 'Jairampur market culvert',
      districtId: CHANGLANG,
      departmentId: RWD,
      schemeId: SCHEMES.PMGSY,
      locationId: BLOCK_JAIRAMPUR,
      financialYear: 2026,
      status: ProjectStatus.ACTIVE,
      sanctionedAmount: 12000000,
      releasedAmount: 9000000,
      contractor: 'M/s Local Works',
      category: ProjectCategory.CULVERT,
      workType: WorkType.RWD,
      startDate: new Date('2026-04-01'),
      expectedCompletion: new Date('2026-12-15'),
      locationText: 'Jairampur',
    },
  });
  await prisma.project.updateMany({
    where: { code: { startsWith: 'TIRAP-' } },
    data: { isActive: false },
  });

  await prisma.projectProgress.deleteMany({
    where: {
      projectId: {
        in: [
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
        ],
      },
    },
  });
  await prisma.projectProgress.createMany({
    data: [
      {
        id: 'cccccccc-cccc-cccc-cccc-ccccccccccc1',
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        version: 1,
        periodYm: '2026-09',
        physicalPercent: 62,
        financialAmount: 72000000,
        status: ProgressStatus.DELAYED,
        remarks: 'Monsoon delay — 42 days',
        createdById: ACTOR,
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-ccccccccccc3',
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        version: 1,
        periodYm: '2026-09',
        physicalPercent: 48,
        financialAmount: 18000000,
        status: ProgressStatus.DELAYED,
        remarks: 'Land and source pending',
        createdById: ACTOR,
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-ccccccccccc4',
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        version: 1,
        periodYm: '2026-09',
        physicalPercent: 55,
        financialAmount: 8000000,
        status: ProgressStatus.DELAYED,
        remarks: 'Material shortage',
        createdById: ACTOR,
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-ccccccccccc5',
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
        version: 1,
        periodYm: '2026-09',
        physicalPercent: 58,
        financialAmount: 98000000,
        status: ProgressStatus.IN_PROGRESS,
        createdById: ACTOR,
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-ccccccccccc6',
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
        version: 1,
        periodYm: '2026-09',
        physicalPercent: 44,
        financialAmount: 28000000,
        status: ProgressStatus.IN_PROGRESS,
        createdById: ACTOR,
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-ccccccccccc7',
        projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
        version: 1,
        periodYm: '2026-09',
        physicalPercent: 81,
        financialAmount: 7200000,
        status: ProgressStatus.IN_PROGRESS,
        createdById: ACTOR,
      },
    ],
  });

  const hdKpis: Array<{
    schemeId: string;
    name: string;
    unit: string;
    target: number;
    achievement: number;
    green?: number;
    amber?: number;
  }> = [
    { schemeId: SCHEMES.NHM, name: 'District Hospital', unit: 'nos', target: 1, achievement: 1, green: 100, amber: 100 },
    { schemeId: SCHEMES.NHM, name: 'CHCs', unit: 'nos', target: 4, achievement: 3 },
    { schemeId: SCHEMES.NHM, name: 'PHCs', unit: 'nos', target: 18, achievement: 16 },
    { schemeId: SCHEMES.NHM, name: 'Doctors', unit: 'persons', target: 85, achievement: 61 },
    { schemeId: SCHEMES.NHM, name: 'Nurses', unit: 'persons', target: 220, achievement: 184 },
    { schemeId: SCHEMES.NHM, name: 'Beds', unit: 'nos', target: 350, achievement: 280 },
    { schemeId: SCHEMES.NHM, name: 'Patient load', unit: 'per day', target: 900, achievement: 820 },
    { schemeId: SCHEMES.NHM, name: 'Institutional deliveries', unit: 'percent', target: 100, achievement: 88, green: 85, amber: 70 },
    { schemeId: SCHEMES.NHM, name: 'Immunisation', unit: 'percent', target: 100, achievement: 91, green: 85, amber: 70 },
    { schemeId: SCHEMES.NHM, name: 'Maternal/child health', unit: 'percent', target: 100, achievement: 84, green: 85, amber: 70 },
    { schemeId: SCHEMES.SCHOOL, name: 'Schools', unit: 'nos', target: 286, achievement: 286 },
    { schemeId: SCHEMES.SCHOOL, name: 'Enrolment', unit: 'students', target: 42000, achievement: 40100 },
    { schemeId: SCHEMES.SCHOOL, name: 'Teachers', unit: 'persons', target: 1450, achievement: 1280 },
    { schemeId: SCHEMES.SCHOOL, name: 'Student-teacher ratio', unit: 'ratio', target: 30, achievement: 31, green: 100, amber: 90 },
    { schemeId: SCHEMES.SCHOOL, name: 'Attendance', unit: 'percent', target: 90, achievement: 82 },
    { schemeId: SCHEMES.SCHOOL, name: 'Infrastructure', unit: 'percent', target: 100, achievement: 79 },
    { schemeId: SCHEMES.SCHOOL, name: 'Dropout', unit: 'percent', target: 5, achievement: 7, green: 100, amber: 80 },
    { schemeId: SCHEMES.SCHOOL, name: 'Results', unit: 'percent', target: 80, achievement: 74 },
    { schemeId: SCHEMES.NSAP, name: 'Old age pension', unit: 'persons', target: 4200, achievement: 3980 },
    { schemeId: SCHEMES.NSAP, name: 'Widow pension', unit: 'persons', target: 2100, achievement: 1960 },
    { schemeId: SCHEMES.NSAP, name: 'Disability pension', unit: 'persons', target: 900, achievement: 810 },
    { schemeId: SCHEMES.NSAP, name: 'SHGs', unit: 'groups', target: 640, achievement: 590 },
    { schemeId: SCHEMES.NSAP, name: 'Lakhpati Didi', unit: 'persons', target: 1200, achievement: 740, green: 80, amber: 60 },
    { schemeId: SCHEMES.PMKISAN, name: 'PM-KISAN', unit: 'farmers', target: 18000, achievement: 16400 },
    { schemeId: SCHEMES.PMAY, name: 'PMAY', unit: 'houses', target: 5000, achievement: 3400 },
  ];
  for (const item of hdKpis) {
    const existing = await prisma.schemeKpi.findFirst({ where: { schemeId: item.schemeId, name: item.name } });
    const kpi = existing
      ? await prisma.schemeKpi.update({
          where: { id: existing.id },
          data: {
            target: item.target,
            greenThreshold: item.green ?? 90,
            amberThreshold: item.amber ?? 70,
          },
        })
      : await prisma.schemeKpi.create({
          data: {
            schemeId: item.schemeId,
            name: item.name,
            unit: item.unit,
            target: item.target,
            greenThreshold: item.green ?? 90,
            amberThreshold: item.amber ?? 70,
          },
        });
    await prisma.schemeProgress.upsert({
      where: { kpiId_periodYm: { kpiId: kpi.id, periodYm: '2026-09' } },
      update: { achievement: item.achievement, physicalPercent: Math.round((item.achievement / item.target) * 100) },
      create: {
        kpiId: kpi.id,
        periodYm: '2026-09',
        target: item.target,
        achievement: item.achievement,
        physicalPercent: Math.round((item.achievement / item.target) * 100),
        createdById: ACTOR,
      },
    });
  }

  console.log('Works seed complete.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
