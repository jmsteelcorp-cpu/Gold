import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.agent.upsert({
    where: { agentNo: 'AG-1001' },
    update: {},
    create: {
      agentNo: 'AG-1001',
      agentName: 'Al Futtaim Realty',
      contact: '+971 4 234 5000',
      commissionType: 'percentage',
      commissionValue: 10,
    },
  });
  await prisma.agent.upsert({
    where: { agentNo: 'AG-1002' },
    update: {},
    create: {
      agentNo: 'AG-1002',
      agentName: 'Dubai Property Hub',
      contact: '+971 4 555 1122',
      commissionType: 'flat',
      commissionValue: 500,
    },
  });
  console.log('Seed complete — agents AG-1001 and AG-1002 created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
