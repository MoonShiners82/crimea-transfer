-- Drop old tables and recreate to match Prisma schema
-- Run this in Supabase SQL Editor

DROP TABLE IF EXISTS "BackgroundCheck" CASCADE;
DROP TABLE IF EXISTS "Booking" CASCADE;
DROP TABLE IF EXISTS "Route" CASCADE;
DROP TABLE IF EXISTS "OtpCode" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;

-- User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- Route
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "fromPoint" TEXT NOT NULL,
    "toPoint" TEXT NOT NULL,
    "distanceKm" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "priceBase" INTEGER NOT NULL,
    "pricePerBaggage" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- Booking
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,
    "passengers" INTEGER NOT NULL,
    "baggageType" TEXT NOT NULL,
    "priceCalculated" INTEGER NOT NULL,
    "priceFinal" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "driverName" TEXT,
    "driverPhone" TEXT,
    "carInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_routeId_idx" ON "Booking"("routeId");
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- OtpCode
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- VerificationToken
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- BackgroundCheck
CREATE TABLE "BackgroundCheck" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL,
    "hasRecord" BOOLEAN NOT NULL,
    "recordType" TEXT,
    "details" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedBy" TEXT,

    CONSTRAINT "BackgroundCheck_pkey" PRIMARY KEY ("id")
);

-- Seed routes (Crimea transfer routes)
INSERT INTO "Route" ("id", "fromPoint", "toPoint", "distanceKm", "durationMin", "priceBase", "pricePerBaggage") VALUES
('r1', 'Аэропорт Симферополь', 'Ялта', 85, 90, 3500, 500),
('r2', 'Аэропорт Симферополь', 'Алушта', 60, 70, 3000, 400),
('r3', 'Аэропорт Симферополь', 'Евпатория', 65, 75, 2800, 400),
('r4', 'Аэропорт Симферополь', 'Севастополь', 75, 85, 3200, 500),
('r5', 'Аэропорт Симферополь', 'Керчь', 200, 180, 6500, 700),
('r6', 'Аэропорт Симферополь', 'Феодосия', 110, 120, 4000, 500),
('r7', 'Аэропорт Симферополь', 'Судак', 95, 110, 3800, 500),
('r8', 'Аэропорт Симферополь', 'Гурзуф', 82, 95, 3400, 500),
('r9', 'Аэропорт Симферополь', 'Партенит', 78, 90, 3300, 500),
('r10', 'Аэропорт Симферополь', 'Мисхор', 88, 100, 3600, 500);
