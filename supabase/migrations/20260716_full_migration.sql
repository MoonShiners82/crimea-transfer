-- =============================================
-- Миграция БД: 2026-07-16
-- Все изменения за одну транзакцию
-- Запустить в Supabase SQL Editor
-- =============================================

BEGIN;

-- 1. Добавить поле notes в Booking
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- 2. Добавить поле licensePlate в Driver
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "licensePlate" TEXT;

-- 3. Создать таблицу BookingAudit
CREATE TABLE IF NOT EXISTS "BookingAudit" (
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

CREATE INDEX IF NOT EXISTS "BookingAudit_bookingId_idx" ON "BookingAudit"("bookingId");
CREATE INDEX IF NOT EXISTS "BookingAudit_createdAt_idx" ON "BookingAudit"("createdAt");

-- 4. Создать таблицу Review
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Review_isActive_idx" ON "Review"("isActive");
CREATE INDEX IF NOT EXISTS "Review_createdAt_idx" ON "Review"("createdAt");

-- 5. Seed: отзывы (только если таблица пуста)
INSERT INTO "Review" ("id", "name", "text", "rating", "isActive")
SELECT * FROM (VALUES
  ('r1', 'Анна М.', 'Отличный трансфер! Водитель встретил в аэропорту с табличкой, помог с багажом. Машина чистая и комфортная. Доехали до Ялты быстро.', 5, true),
  ('r2', 'Сергей К.', 'Заказывал трансфер из Симферополя в Севастополь. Всё чётко, без опозданий. Цена как при заказе, без доплат.', 5, true),
  ('r3', 'Елена В.', 'Второй раз пользуюсь сервисом. Очень удобно — не нужно искать такси в аэропорту. Водители вежливые и знают дорогу.', 5, true)
) AS v(id, name, text, rating, isActive)
WHERE NOT EXISTS (SELECT 1 FROM "Review" LIMIT 1);

COMMIT;
