-- Create extension for vector type (required for face embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Hikers (registry of BAD group members)
CREATE TABLE IF NOT EXISTS hikers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  face_trained boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 2. Face Signatures (facial embeddings for recognition)
CREATE TABLE IF NOT EXISTS face_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hiker_id uuid NOT NULL REFERENCES hikers(id) ON DELETE CASCADE,
  embedding vector(128),
  source text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 3. Trails (BAD hiking routes)
CREATE TABLE IF NOT EXISTS trails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trail_name text NOT NULL,
  alltrails_url text,
  distance_miles numeric,
  elevation_gain_ft integer,
  avg_duration_minutes integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 4. Hike Sessions (actual group hike events)
CREATE TABLE IF NOT EXISTS hike_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trail_id uuid REFERENCES trails(id) ON DELETE SET NULL,
  hike_date date NOT NULL DEFAULT CURRENT_DATE,
  photo_count integer DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 5. Attendance (who attended which hike)
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hike_session_id uuid NOT NULL REFERENCES hike_sessions(id) ON DELETE CASCADE,
  hiker_id uuid NOT NULL REFERENCES hikers(id) ON DELETE CASCADE,
  confirmation_status text DEFAULT 'auto_detected',
  confidence numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(hike_session_id, hiker_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hikers_user_id ON hikers(user_id);
CREATE INDEX IF NOT EXISTS idx_face_signatures_hiker_id ON face_signatures(hiker_id);
CREATE INDEX IF NOT EXISTS idx_face_signatures_user_id ON face_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_trails_user_id ON trails(user_id);
CREATE INDEX IF NOT EXISTS idx_hike_sessions_user_id ON hike_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_hike_sessions_trail_id ON hike_sessions(trail_id);
CREATE INDEX IF NOT EXISTS idx_hike_sessions_date ON hike_sessions(hike_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_hike_session_id ON attendance(hike_session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);

-- Enable RLS on all tables
ALTER TABLE hikers ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE hike_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hikers
DROP POLICY IF EXISTS "user_select_hikers" ON hikers;
CREATE POLICY "user_select_hikers" ON hikers FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_hikers" ON hikers;
CREATE POLICY "user_insert_hikers" ON hikers FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_hikers" ON hikers;
CREATE POLICY "user_update_hikers" ON hikers FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_delete_hikers" ON hikers;
CREATE POLICY "user_delete_hikers" ON hikers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for face_signatures
DROP POLICY IF EXISTS "user_select_face_signatures" ON face_signatures;
CREATE POLICY "user_select_face_signatures" ON face_signatures FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_face_signatures" ON face_signatures;
CREATE POLICY "user_insert_face_signatures" ON face_signatures FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_face_signatures" ON face_signatures;
CREATE POLICY "user_update_face_signatures" ON face_signatures FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_delete_face_signatures" ON face_signatures;
CREATE POLICY "user_delete_face_signatures" ON face_signatures FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for trails
DROP POLICY IF EXISTS "user_select_trails" ON trails;
CREATE POLICY "user_select_trails" ON trails FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_trails" ON trails;
CREATE POLICY "user_insert_trails" ON trails FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_trails" ON trails;
CREATE POLICY "user_update_trails" ON trails FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_delete_trails" ON trails;
CREATE POLICY "user_delete_trails" ON trails FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for hike_sessions
DROP POLICY IF EXISTS "user_select_hike_sessions" ON hike_sessions;
CREATE POLICY "user_select_hike_sessions" ON hike_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_hike_sessions" ON hike_sessions;
CREATE POLICY "user_insert_hike_sessions" ON hike_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_hike_sessions" ON hike_sessions;
CREATE POLICY "user_update_hike_sessions" ON hike_sessions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_delete_hike_sessions" ON hike_sessions;
CREATE POLICY "user_delete_hike_sessions" ON hike_sessions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for attendance
DROP POLICY IF EXISTS "user_select_attendance" ON attendance;
CREATE POLICY "user_select_attendance" ON attendance FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_attendance" ON attendance;
CREATE POLICY "user_insert_attendance" ON attendance FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_attendance" ON attendance;
CREATE POLICY "user_update_attendance" ON attendance FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_delete_attendance" ON attendance;
CREATE POLICY "user_delete_attendance" ON attendance FOR DELETE USING (auth.uid() = user_id);
