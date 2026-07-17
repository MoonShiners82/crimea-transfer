-- Add carPhotoUrl and comments columns to Driver
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "carPhotoUrl" TEXT;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "comments" TEXT;
