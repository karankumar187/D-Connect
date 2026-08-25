import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial dashboard user...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash: passwordHash,
      name: 'Alex Rivers',
      notifications: {
        create: [
          {
            type: 'info',
            title: 'Dashboard Initialized',
            body: 'Welcome to the official Discord Account Dashboard. You can now connect up to 5 Discord accounts.',
          },
        ],
      },
    },
  });

  console.log(`Demo user ready: ${user.email} (password: password123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
