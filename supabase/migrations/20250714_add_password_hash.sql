-- Add passwordHash column to User table for password auth
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
