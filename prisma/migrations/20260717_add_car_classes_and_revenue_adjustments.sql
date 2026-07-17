-- Add carClasses to Driver
ALTER TABLE "Driver" ADD COLUMN "carClasses" TEXT NOT NULL DEFAULT '';

-- Create RevenueAdjustment table
CREATE TABLE "RevenueAdjustment" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RevenueAdjustment_date_idx" ON "RevenueAdjustment"("date");
