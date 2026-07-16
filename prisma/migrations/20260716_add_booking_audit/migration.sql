-- CreateTable
CREATE TABLE "BookingAudit" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "performedBy" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingAudit_bookingId_idx" ON "BookingAudit"("bookingId");

-- CreateIndex
CREATE INDEX "BookingAudit_createdAt_idx" ON "BookingAudit"("createdAt");
