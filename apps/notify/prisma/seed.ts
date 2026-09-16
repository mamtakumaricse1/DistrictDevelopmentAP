import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();
const CHANGLANG = '11111111-1111-1111-1111-111111111111';

async function main(): Promise<void> {
  await prisma.notification.upsert({
    where: { id: 'ffffffff-ffff-ffff-ffff-fffffffffff1' },
    update: { title: 'Welcome to works monitoring' },
    create: {
      id: 'ffffffff-ffff-ffff-ffff-fffffffffff1',
      districtId: CHANGLANG,
      title: 'Welcome to works monitoring',
      body: 'Progress delays and review actions will appear here.',
      type: 'SYSTEM',
    },
  });
  console.log('Notify seed complete.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
