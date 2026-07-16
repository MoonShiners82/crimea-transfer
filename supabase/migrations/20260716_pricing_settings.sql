-- Add Setting table for global configuration
CREATE TABLE IF NOT EXISTS "Setting" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add carClass column to Booking
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "carClass" TEXT;

-- Seed default settings
INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES
  ('pricePerKm', '25', CURRENT_TIMESTAMP),
  ('carClasses', '[{"id":"economy","name":"Эконом","coefficient":0.8},{"id":"comfort","name":"Комфорт","coefficient":1.0},{"id":"comfort_plus","name":"Комфорт+","coefficient":1.2},{"id":"business","name":"Бизнес","coefficient":1.4},{"id":"minibus","name":"Микроавтобус","coefficient":1.6}]', CURRENT_TIMESTAMP),
  ('extraPassengerPrice', '300', CURRENT_TIMESTAMP),
  ('nightCoefficient', '1.2', CURRENT_TIMESTAMP),
  ('nightHoursStart', '23', CURRENT_TIMESTAMP),
  ('nightHoursEnd', '6', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
