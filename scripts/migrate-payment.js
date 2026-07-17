const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  try {
    await p.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Payment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "bookingId" TEXT NOT NULL,
      "yookassaId" TEXT,
      "amount" INTEGER NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'RUB',
      "status" TEXT NOT NULL DEFAULT 'pending',
      "paymentMethod" TEXT,
      "confirmationUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    )`);
    console.log('Payment table created');

    await p.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Payment_yookassaId_key" ON "Payment"("yookassaId")`);
    await p.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Payment_bookingId_idx" ON "Payment"("bookingId")`);
    console.log('Payment indexes created');

    try {
      await p.$executeRawUnsafe(`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT`);
      console.log('paymentStatus column added to Booking');
    } catch(e) {
      console.log('paymentStatus may already exist:', e.message);
    }

    console.log('All migrations applied successfully');
  } catch(e) {
    console.error('Migration error:', e.message);
  } finally {
    await p.$disconnect();
  }
}
main();
