-- Create travel_plans table for tracking family and personal travel
CREATE TABLE IF NOT EXISTS travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  traveler_name TEXT NOT NULL, -- Who is traveling: Umair, Nyel, Emaad, Omer, Huma, etc.
  trip_type TEXT NOT NULL, -- 'family', 'solo', 'work'
  travel_category TEXT NOT NULL, -- 'work', 'leisure'
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  budget DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'planned', -- 'planned', 'confirmed', 'in_progress', 'completed', 'cancelled'
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_travel_plans_user_id ON travel_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_plans_start_date ON travel_plans(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_travel_plans_traveler ON travel_plans(traveler_name);
CREATE INDEX IF NOT EXISTS idx_travel_plans_trip_type ON travel_plans(trip_type);

-- Enable RLS (user can see all travel plans, but only edit/delete their own)
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies: user can read all travel plans (to see family's plans), but only edit/delete own
DROP POLICY IF EXISTS "user_select_travel_plans" ON travel_plans;
CREATE POLICY "user_select_travel_plans" ON travel_plans FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_travel_plans" ON travel_plans;
CREATE POLICY "user_insert_travel_plans" ON travel_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_travel_plans" ON travel_plans;
CREATE POLICY "user_update_travel_plans" ON travel_plans FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_delete_travel_plans" ON travel_plans;
CREATE POLICY "user_delete_travel_plans" ON travel_plans FOR DELETE USING (auth.uid() = user_id);
