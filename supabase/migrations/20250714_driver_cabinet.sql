-- Add fields to Driver table
ALTER TABLE "Driver" ADD COLUMN "userId" TEXT UNIQUE;
ALTER TABLE "Driver" ADD COLUMN "photoUrl" TEXT;
ALTER TABLE "Driver" ADD COLUMN "status" TEXT DEFAULT 'pending';

-- Add FK from Driver to User
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;

-- Add driverId to Booking
ALTER TABLE "Booking" ADD COLUMN "driverId" TEXT;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL;

-- Indexes
CREATE INDEX "Driver_userId_idx" ON "Driver"("userId");
CREATE INDEX "Driver_status_idx" ON "Driver"("status");
CREATE INDEX "Booking_driverId_idx" ON "Booking"("driverId");
