-- Row Level Security Policies for TogoCrimea
-- Execute after creating tables

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Route" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OtpCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BackgroundCheck" ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view own profile" ON "User"
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON "User"
    FOR UPDATE USING (auth.uid()::text = id);

-- Route policies (public read)
CREATE POLICY "Anyone can view active routes" ON "Route"
    FOR SELECT USING (isActive = true);

-- Booking policies
CREATE POLICY "Users can view own bookings" ON "Booking"
    FOR SELECT USING (userId = auth.uid()::text);

CREATE POLICY "Users can create own bookings" ON "Booking"
    FOR INSERT WITH CHECK (userId = auth.uid()::text);

CREATE POLICY "Users can update own bookings" ON "Booking"
    FOR UPDATE USING (userId = auth.uid()::text);

-- Admin policies (for service role)
CREATE POLICY "Service role can do everything on User" ON "User"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on Route" ON "Route"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on Booking" ON "Booking"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on OtpCode" ON "OtpCode"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on BackgroundCheck" ON "BackgroundCheck"
    FOR ALL USING (auth.role() = 'service_role');
