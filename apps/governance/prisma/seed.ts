import { ActionSeverity, PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();
const CHANGLANG = '11111111-1111-1111-1111-111111111111';
const CHANGLANG_PWD = '33333333-3333-3333-3333-333333333333';
const CHANGLANG_PHED = '33333333-3333-3333-3333-333333333336';
const CHANGLANG_EDU = '33333333-3333-3333-3333-333333333334';

async function main(): Promise<void> {
  await prisma.reviewMeeting.upsert({
    where: { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd1' },
    update: {
      title: 'DC Changlang monthly review',
      scheduledAt: new Date('2026-09-20T10:00:00.000Z'),
      nextReviewAt: new Date('2026-10-05T10:00:00.000Z'),
      isActive: true,
    },
    create: {
      id: 'dddddddd-dddd-dddd-dddd-ddddddddddd1',
      districtId: CHANGLANG,
      title: 'DC Changlang monthly review',
      scheduledAt: new Date('2026-09-20T10:00:00.000Z'),
      nextReviewAt: new Date('2026-10-05T10:00:00.000Z'),
      venue: 'DC office',
      createdById: '00000000-0000-0000-0000-000000000001',
    },
  });

  const actions = [
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
      departmentId: CHANGLANG_PWD,
      projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      title: 'Road project delayed — Changlang HQ approach',
      dcDirection: 'Complete pending road work and report by next review',
      officerName: 'EE PWD',
      locationText: 'Changlang HQ',
      severity: ActionSeverity.IMMEDIATE,
      dueDate: new Date('2026-09-30'),
      createdAt: new Date('2026-08-08'),
    },
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
      departmentId: CHANGLANG_PHED,
      projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
      title: 'Water project pending — Nongthey',
      dcDirection: 'Complete pending water schemes in Nongthey village',
      officerName: 'EE PHED',
      locationText: 'Nongthey, Jairampur',
      severity: ActionSeverity.IMMEDIATE,
      dueDate: new Date('2026-09-30'),
      createdAt: new Date('2026-08-22'),
    },
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3',
      departmentId: CHANGLANG_EDU,
      projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
      title: 'School infrastructure — Khimyang',
      dcDirection: 'Mobilise materials and resume construction',
      officerName: 'DEO',
      locationText: 'Khimyang',
      severity: ActionSeverity.ATTENTION,
      dueDate: new Date('2026-10-10'),
      createdAt: new Date('2026-08-29'),
    },
  ];

  for (const action of actions) {
    await prisma.actionItem.upsert({
      where: { id: action.id },
      update: {
        title: action.title,
        dcDirection: action.dcDirection,
        officerName: action.officerName,
        locationText: action.locationText,
        severity: action.severity,
        isActive: true,
      },
      create: {
        id: action.id,
        meetingId: 'dddddddd-dddd-dddd-dddd-ddddddddddd1',
        districtId: CHANGLANG,
        departmentId: action.departmentId,
        projectId: action.projectId,
        title: action.title,
        dcDirection: action.dcDirection,
        officerName: action.officerName,
        locationText: action.locationText,
        severity: action.severity,
        dueDate: action.dueDate,
        createdAt: action.createdAt,
        createdById: '00000000-0000-0000-0000-000000000001',
      },
    });
  }
  console.log('Governance seed complete.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
