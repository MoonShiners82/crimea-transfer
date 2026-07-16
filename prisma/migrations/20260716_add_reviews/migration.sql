-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_isActive_idx" ON "Review"("isActive");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- SeedData
INSERT INTO "Review" ("id", "name", "text", "rating", "isActive") VALUES
('r1', 'Анна М.', 'Отличный трансфер! Водитель встретил в аэропорту с табличкой, помог с багажом. Машина чистая и комфортная. Доехали до Ялты быстро.', 5, true),
('r2', 'Сергей К.', 'Заказывал трансфер из Симферополя в Севастополь. Всё чётко, без опозданий. Цена как при заказе, без доплат.', 5, true),
('r3', 'Елена В.', 'Второй раз пользуюсь сервисом. Очень удобно — не нужно искать такси в аэропорту. Водители вежливые и знают дорогу.', 5, true);
