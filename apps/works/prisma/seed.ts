import { PrismaClient, ProjectStatus, ProgressStatus } from '../src/generated/prisma';

const prisma = new PrismaClient();

const CHANGLANG = '11111111-1111-1111-1111-111111111111';
const TIRAP = '22222222-2222-2222-2222-222222222222';
const CHANGLANG_PWD = '33333333-3333-3333-3333-333333333333';
const TIRAP_PWD = '55555555-5555-5555-5555-555555555555';

async function main(): Promise<void> {
  await prisma.projectSequence.upsert({
    where: {
      districtId_departmentId_year: {
        districtId: CHANGLANG,
        departmentId: CHANGLANG_PWD,
        year: 2026,
      },
    },
    update: { lastValue: 1 },
    create: { districtId: CHANGLANG, departmentId: CHANGLANG_PWD, year: 2026, lastValue: 1 },
  });
  await prisma.projectSequence.upsert({
    where: {
      districtId_departmentId_year: {
        districtId: TIRAP,
        departmentId: TIRAP_PWD,
        year: 2026,
      },
    },
    update: { lastValue: 1 },
    create: { districtId: TIRAP, departmentId: TIRAP_PWD, year: 2026, lastValue: 1 },
  });

  await prisma.project.upsert({
    where: { code: 'CHANGLANG-PWD-2026-00001' },
    update: { name: 'Changlang PWD road strengthening', isActive: true },
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      code: 'CHANGLANG-PWD-2026-00001',
      name: 'Changlang PWD road strengthening',
      districtId: CHANGLANG,
      departmentId: CHANGLANG_PWD,
      financialYear: 2026,
      status: ProjectStatus.ACTIVE,
      locationText: 'Changlang HQ approach',
    },
  });
  await prisma.project.upsert({
    where: { code: 'TIRAP-PWD-2026-00001' },
    update: { name: 'Tirap PWD rural connectivity', isActive: true },
    create: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
      code: 'TIRAP-PWD-2026-00001',
      name: 'Tirap PWD rural connectivity',
      districtId: TIRAP,
      departmentId: TIRAP_PWD,
      financialYear: 2026,
      status: ProjectStatus.ACTIVE,
      locationText: 'Khonsa',
    },
  });

  await prisma.projectProgress.deleteMany({
    where: { projectId: { in: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'] } },
  });
  await prisma.projectProgress.create({
    data: {
      id: 'cccccccc-cccc-cccc-cccc-ccccccccccc1',
      projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      version: 1,
      periodYm: '2026-08',
      physicalPercent: 35,
      status: ProgressStatus.DELAYED,
      remarks: 'Monsoon delay',
      createdById: '11111111-1111-1111-1111-aaaaaaaaaaa1',
    },
  });
  await prisma.projectProgress.create({
    data: {
      id: 'cccccccc-cccc-cccc-cccc-ccccccccccc2',
      projectId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
      version: 1,
      periodYm: '2026-08',
      physicalPercent: 60,
      status: ProgressStatus.IN_PROGRESS,
      createdById: '22222222-2222-2222-2222-bbbbbbbbbbb1',
    },
  });
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
