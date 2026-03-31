-- Create work_feelings table for tracking work-related emotions and events
CREATE TABLE IF NOT EXISTS work_feelings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_description TEXT NOT NULL,
  feelings TEXT NOT NULL,
  reaction TEXT NOT NULL,
  category TEXT, -- e.g., "meeting", "interaction", "feedback", "project", "team", "conflict", "success"
  intensity INT CHECK (intensity >= 1 AND intensity <= 10), -- 1-10 scale of emotional intensity
  tags TEXT[], -- array of tags for filtering
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_work_feelings_user_id ON work_feelings(user_id);
CREATE INDEX IF NOT EXISTS idx_work_feelings_event_date ON work_feelings(event_date DESC);

-- Enable RLS
ALTER TABLE work_feelings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (user can only see their own entries)
DROP POLICY IF EXISTS "user_select_work_feelings" ON work_feelings;
CREATE POLICY "user_select_work_feelings" ON work_feelings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_work_feelings" ON work_feelings;
CREATE POLICY "user_insert_work_feelings" ON work_feelings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_work_feelings" ON work_feelings;
CREATE POLICY "user_update_work_feelings" ON work_feelings FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_delete_work_feelings" ON work_feelings;
CREATE POLICY "user_delete_work_feelings" ON work_feelings FOR DELETE USING (auth.uid() = user_id);
