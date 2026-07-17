const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$executeRaw`ALTER TABLE "FlashCallVerification" ALTER COLUMN "pin" DROP NOT NULL`;
    console.log('pin column made nullable');
  } catch (e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
