-- Seed data for TogoCrimea
-- Execute after creating tables

-- Routes (маршруты трансферов)
INSERT INTO "Route" ("id", "fromPoint", "toPoint", "distanceKm", "durationMin", "priceBase", "pricePerBaggage", "isActive") VALUES
('route_simf_yalta', 'Аэропорт Симферополь', 'Ялта', 85, 120, 2500, 300, true),
('route_simf_alushta', 'Аэропорт Симферополь', 'Алушта', 55, 80, 2000, 250, true),
('route_simf_sudak', 'Аэропорт Симферополь', 'Судак', 110, 150, 3000, 350, true),
('route_simf_feodosia', 'Аэропорт Симферополь', 'Феодосия', 120, 160, 3200, 350, true),
('route_simf_evpatoria', 'Аэропорт Симферополь', 'Евпатория', 65, 90, 2200, 250, true),
('route_simf_sevastopol', 'Аэропорт Симферополь', 'Севастополь', 80, 100, 2800, 300, true),
('route_simf_bakhchisaray', 'Аэропорт Симферополь', 'Бахчисарай', 30, 45, 1500, 200, true),
('route_simf_simferopol', 'Аэропорт Симферополь', 'Симферополь (город)', 15, 25, 800, 100, true);
