import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();
const CHANGLANG = '11111111-1111-1111-1111-111111111111';
const CHANGLANG_PWD = '33333333-3333-3333-3333-333333333333';

async function main(): Promise<void> {
  await prisma.reviewMeeting.upsert({
    where: { id: 'dddddddd-dddd-dddd-dddd-ddddddddddd1' },
    update: { title: 'Changlang monthly works review', isActive: true },
    create: {
      id: 'dddddddd-dddd-dddd-dddd-ddddddddddd1',
      districtId: CHANGLANG,
      title: 'Changlang monthly works review',
      scheduledAt: new Date('2026-09-20T10:00:00.000Z'),
      venue: 'DC office',
      createdById: '00000000-0000-0000-0000-000000000001',
    },
  });
  await prisma.actionItem.upsert({
    where: { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1' },
    update: { title: 'Clear monsoon delay on PWD road', isActive: true },
    create: {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
      meetingId: 'dddddddd-dddd-dddd-dddd-ddddddddddd1',
      districtId: CHANGLANG,
      departmentId: CHANGLANG_PWD,
      projectId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      title: 'Clear monsoon delay on PWD road',
      dueDate: new Date('2026-09-30'),
      createdById: '00000000-0000-0000-0000-000000000001',
    },
  });
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
