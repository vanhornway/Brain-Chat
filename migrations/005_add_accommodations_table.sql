-- Create accommodations table for hotels, Airbnbs, and other lodging
CREATE TABLE IF NOT EXISTS accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  travel_plan_id UUID REFERENCES travel_plans(id) ON DELETE CASCADE,
  accommodation_type TEXT NOT NULL, -- 'hotel', 'airbnb', 'hostel', 'resort', 'cabin', 'other'
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  confirmation_number TEXT,
  booking_reference TEXT,
  total_cost DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  cost_per_night DECIMAL(10, 2),
  number_of_nights INT,
  rating DECIMAL(3, 1), -- 0-5 star rating
  review TEXT,
  amenities TEXT[], -- array of amenities (wifi, pool, breakfast, etc.)
  cancellation_policy TEXT,
  booking_platform TEXT, -- 'booking.com', 'airbnb', 'hotels.com', 'direct', etc.
  booking_url TEXT,
  payment_method TEXT,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accommodations_user_id ON accommodations(user_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_travel_plan_id ON accommodations(travel_plan_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_check_in ON accommodations(check_in_date DESC);
CREATE INDEX IF NOT EXISTS idx_accommodations_city ON accommodations(city);

-- Enable RLS (user can only see/edit own accommodations)
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_select_accommodations" ON accommodations;
CREATE POLICY "user_select_accommodations" ON accommodations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_accommodations" ON accommodations;
CREATE POLICY "user_insert_accommodations" ON accommodations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_accommodations" ON accommodations;
CREATE POLICY "user_update_accommodations" ON accommodations FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_delete_accommodations" ON accommodations;
CREATE POLICY "user_delete_accommodations" ON accommodations FOR DELETE USING (auth.uid() = user_id);
