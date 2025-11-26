import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setUserAsAdmin() {
  const username = process.argv[2];

  if (!username) {
    console.error('❌ Usage: npm run set-admin <username>');
    console.error('   Example: npm run set-admin "DOMA\\paulo.lopes"');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.error(`❌ User "${username}" not found in database`);
      process.exit(1);
    }

    await prisma.user.update({
      where: { username },
      data: { isAdmin: true },
    });

    console.log(`✅ User "${username}" is now an admin!`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setUserAsAdmin();
