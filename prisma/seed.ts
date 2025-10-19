import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create users
  const user1 = await prisma.user.upsert({
    where: { email: 'andres.largo@example.com' },
    update: {},
    create: {
      email: 'andres.largo@example.com',
      name: 'Andres Largo',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'felipe.rodriguez@example.com' },
    update: {},
    create: {
      email: 'felipe.rodriguez@example.com',
      name: 'Felipe Rodriguez',
    },
  });

  console.log('Created users:', { user1, user2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
