-- Role-Based Access Control (RBAC) + Subject-Level Access
-- Enables fine-grained permissions: which users can read/write which tables and subjects

-- ============================================================
-- 1. PERMISSION TABLES
-- ============================================================

-- Who can access which subject (Umair, Nyel, Emaad, Omer)
CREATE TABLE user_subject_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  can_read boolean DEFAULT true,
  can_write boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, subject)
);

-- Who can access which tables
CREATE TABLE user_table_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  can_read boolean DEFAULT false,
  can_write boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, table_name)
);

-- Create indexes for fast permission lookups
CREATE INDEX idx_user_subject_access_user_id ON user_subject_access(user_id);
CREATE INDEX idx_user_subject_access_subject ON user_subject_access(subject);
CREATE INDEX idx_user_table_access_user_id ON user_table_access(user_id);
CREATE INDEX idx_user_table_access_table ON user_table_access(table_name);

-- Enable RLS on permission tables
ALTER TABLE user_subject_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_table_access ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own permissions
CREATE POLICY "users_read_own_subject_access" ON user_subject_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_read_own_table_access" ON user_table_access
  FOR SELECT USING (auth.uid() = user_id);

-- Allow service role to manage permissions (via API or admin)
CREATE POLICY "service_role_manage_permissions" ON user_subject_access
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_manage_table_access" ON user_table_access
  USING (true) WITH CHECK (true);

-- ============================================================
-- 2. UPDATE RLS POLICIES FOR SUBJECT-BASED TABLES
-- ============================================================
-- Tables with 'subject' column: blood_glucose, blood_pressure, weight_log, workouts,
-- health_metrics, fasting_windows, meals, lumen_entries, goals, etc.

-- Drop old policies that only check user_id
DROP POLICY IF EXISTS "user_select_blood_glucose" ON blood_glucose;
DROP POLICY IF EXISTS "user_insert_blood_glucose" ON blood_glucose;
DROP POLICY IF EXISTS "user_update_blood_glucose" ON blood_glucose;
DROP POLICY IF EXISTS "user_delete_blood_glucose" ON blood_glucose;

DROP POLICY IF EXISTS "user_select_blood_pressure" ON blood_pressure;
DROP POLICY IF EXISTS "user_insert_blood_pressure" ON blood_pressure;
DROP POLICY IF EXISTS "user_update_blood_pressure" ON blood_pressure;
DROP POLICY IF EXISTS "user_delete_blood_pressure" ON blood_pressure;

DROP POLICY IF EXISTS "user_select_weight_log" ON weight_log;
DROP POLICY IF EXISTS "user_insert_weight_log" ON weight_log;
DROP POLICY IF EXISTS "user_update_weight_log" ON weight_log;
DROP POLICY IF EXISTS "user_delete_weight_log" ON weight_log;

DROP POLICY IF EXISTS "user_select_workouts" ON workouts;
DROP POLICY IF EXISTS "user_insert_workouts" ON workouts;
DROP POLICY IF EXISTS "user_update_workouts" ON workouts;
DROP POLICY IF EXISTS "user_delete_workouts" ON workouts;

DROP POLICY IF EXISTS "user_select_health_metrics" ON health_metrics;
DROP POLICY IF EXISTS "user_insert_health_metrics" ON health_metrics;
DROP POLICY IF EXISTS "user_update_health_metrics" ON health_metrics;
DROP POLICY IF EXISTS "user_delete_health_metrics" ON health_metrics;

DROP POLICY IF EXISTS "user_select_fasting_windows" ON fasting_windows;
DROP POLICY IF EXISTS "user_insert_fasting_windows" ON fasting_windows;
DROP POLICY IF EXISTS "user_update_fasting_windows" ON fasting_windows;
DROP POLICY IF EXISTS "user_delete_fasting_windows" ON fasting_windows;

DROP POLICY IF EXISTS "user_select_meals" ON meals;
DROP POLICY IF EXISTS "user_insert_meals" ON meals;
DROP POLICY IF EXISTS "user_update_meals" ON meals;
DROP POLICY IF EXISTS "user_delete_meals" ON meals;

DROP POLICY IF EXISTS "user_select_lumen_entries" ON lumen_entries;
DROP POLICY IF EXISTS "user_insert_lumen_entries" ON lumen_entries;
DROP POLICY IF EXISTS "user_update_lumen_entries" ON lumen_entries;
DROP POLICY IF EXISTS "user_delete_lumen_entries" ON lumen_entries;

DROP POLICY IF EXISTS "user_select_lab_results" ON lab_results;
DROP POLICY IF EXISTS "user_insert_lab_results" ON lab_results;
DROP POLICY IF EXISTS "user_update_lab_results" ON lab_results;
DROP POLICY IF EXISTS "user_delete_lab_results" ON lab_results;

DROP POLICY IF EXISTS "user_select_goals" ON goals;
DROP POLICY IF EXISTS "user_insert_goals" ON goals;
DROP POLICY IF EXISTS "user_update_goals" ON goals;
DROP POLICY IF EXISTS "user_delete_goals" ON goals;

DROP POLICY IF EXISTS "user_select_scout_progress" ON scout_progress;
DROP POLICY IF EXISTS "user_insert_scout_progress" ON scout_progress;
DROP POLICY IF EXISTS "user_update_scout_progress" ON scout_progress;
DROP POLICY IF EXISTS "user_delete_scout_progress" ON scout_progress;

DROP POLICY IF EXISTS "user_select_scout_merit_badges" ON scout_merit_badges;
DROP POLICY IF EXISTS "user_insert_scout_merit_badges" ON scout_merit_badges;
DROP POLICY IF EXISTS "user_update_scout_merit_badges" ON scout_merit_badges;
DROP POLICY IF EXISTS "user_delete_scout_merit_badges" ON scout_merit_badges;

DROP POLICY IF EXISTS "user_select_college_prep_log" ON college_prep_log;
DROP POLICY IF EXISTS "user_insert_college_prep_log" ON college_prep_log;
DROP POLICY IF EXISTS "user_update_college_prep_log" ON college_prep_log;
DROP POLICY IF EXISTS "user_delete_college_prep_log" ON college_prep_log;

DROP POLICY IF EXISTS "user_select_college_prep_timeline" ON college_prep_timeline;
DROP POLICY IF EXISTS "user_insert_college_prep_timeline" ON college_prep_timeline;
DROP POLICY IF EXISTS "user_update_college_prep_timeline" ON college_prep_timeline;
DROP POLICY IF EXISTS "user_delete_college_prep_timeline" ON college_prep_timeline;

DROP POLICY IF EXISTS "user_select_family_events" ON family_events;
DROP POLICY IF EXISTS "user_insert_family_events" ON family_events;
DROP POLICY IF EXISTS "user_update_family_events" ON family_events;
DROP POLICY IF EXISTS "user_delete_family_events" ON family_events;

DROP POLICY IF EXISTS "user_select_school_calendar" ON school_calendar;
DROP POLICY IF EXISTS "user_insert_school_calendar" ON school_calendar;
DROP POLICY IF EXISTS "user_update_school_calendar" ON school_calendar;
DROP POLICY IF EXISTS "user_delete_school_calendar" ON school_calendar;

DROP POLICY IF EXISTS "user_select_vehicle_log" ON vehicle_log;
DROP POLICY IF EXISTS "user_insert_vehicle_log" ON vehicle_log;
DROP POLICY IF EXISTS "user_update_vehicle_log" ON vehicle_log;
DROP POLICY IF EXISTS "user_delete_vehicle_log" ON vehicle_log;

DROP POLICY IF EXISTS "user_select_kids" ON kids;
DROP POLICY IF EXISTS "user_insert_kids" ON kids;
DROP POLICY IF EXISTS "user_update_kids" ON kids;
DROP POLICY IF EXISTS "user_delete_kids" ON kids;

DROP POLICY IF EXISTS "user_select_hiking_history" ON hiking_history;
DROP POLICY IF EXISTS "user_insert_hiking_history" ON hiking_history;
DROP POLICY IF EXISTS "user_update_hiking_history" ON hiking_history;
DROP POLICY IF EXISTS "user_delete_hiking_history" ON hiking_history;

DROP POLICY IF EXISTS "user_select_personal_hikes" ON personal_hikes;
DROP POLICY IF EXISTS "user_insert_personal_hikes" ON personal_hikes;
DROP POLICY IF EXISTS "user_update_personal_hikes" ON personal_hikes;
DROP POLICY IF EXISTS "user_delete_personal_hikes" ON personal_hikes;

DROP POLICY IF EXISTS "user_select_inr_readings" ON inr_readings;
DROP POLICY IF EXISTS "user_insert_inr_readings" ON inr_readings;
DROP POLICY IF EXISTS "user_update_inr_readings" ON inr_readings;
DROP POLICY IF EXISTS "user_delete_inr_readings" ON inr_readings;

DROP POLICY IF EXISTS "user_select_medications" ON medications;
DROP POLICY IF EXISTS "user_insert_medications" ON medications;
DROP POLICY IF EXISTS "user_update_medications" ON medications;
DROP POLICY IF EXISTS "user_delete_medications" ON medications;

DROP POLICY IF EXISTS "user_select_medical_conditions" ON medical_conditions;
DROP POLICY IF EXISTS "user_insert_medical_conditions" ON medical_conditions;
DROP POLICY IF EXISTS "user_update_medical_conditions" ON medical_conditions;
DROP POLICY IF EXISTS "user_delete_medical_conditions" ON medical_conditions;

DROP POLICY IF EXISTS "user_select_doctor_visits" ON doctor_visits;
DROP POLICY IF EXISTS "user_insert_doctor_visits" ON doctor_visits;
DROP POLICY IF EXISTS "user_update_doctor_visits" ON doctor_visits;
DROP POLICY IF EXISTS "user_delete_doctor_visits" ON doctor_visits;

DROP POLICY IF EXISTS "user_select_eye_prescriptions" ON eye_prescriptions;
DROP POLICY IF EXISTS "user_insert_eye_prescriptions" ON eye_prescriptions;
DROP POLICY IF EXISTS "user_update_eye_prescriptions" ON eye_prescriptions;
DROP POLICY IF EXISTS "user_delete_eye_prescriptions" ON eye_prescriptions;

-- Create subject-level RLS policies (for tables with 'subject' column)
-- SELECT: user must have read access to the subject
CREATE POLICY "subject_select_blood_glucose" ON blood_glucose
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_subject_access
      WHERE subject = blood_glucose.subject AND can_read = true
    )
  );

CREATE POLICY "subject_insert_blood_glucose" ON blood_glucose
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_subject_access
      WHERE subject = NEW.subject AND can_write = true
    )
  );

CREATE POLICY "subject_update_blood_glucose" ON blood_glucose
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_subject_access
      WHERE subject = blood_glucose.subject AND can_write = true
    )
  );

CREATE POLICY "subject_delete_blood_glucose" ON blood_glucose
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM user_subject_access
      WHERE subject = blood_glucose.subject AND can_write = true
    )
  );

-- Repeat for other subject-based tables (blood_pressure, weight_log, etc.)
-- For brevity, using a function approach below

-- ============================================================
-- 3. HELPER FUNCTION: Apply Subject-Level Policies to All Tables
-- ============================================================

CREATE OR REPLACE FUNCTION apply_subject_policies(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    CREATE POLICY "subject_select_%s" ON %I
      FOR SELECT USING (
        auth.uid() IN (
          SELECT user_id FROM user_subject_access
          WHERE subject = %I.subject AND can_read = true
        )
      )', table_name, table_name, table_name);

  EXECUTE format('
    CREATE POLICY "subject_insert_%s" ON %I
      FOR INSERT WITH CHECK (
        auth.uid() IN (
          SELECT user_id FROM user_subject_access
          WHERE subject = NEW.subject AND can_write = true
        )
      )', table_name, table_name);

  EXECUTE format('
    CREATE POLICY "subject_update_%s" ON %I
      FOR UPDATE USING (
        auth.uid() IN (
          SELECT user_id FROM user_subject_access
          WHERE subject = %I.subject AND can_write = true
        )
      )', table_name, table_name, table_name);

  EXECUTE format('
    CREATE POLICY "subject_delete_%s" ON %I
      FOR DELETE USING (
        auth.uid() IN (
          SELECT user_id FROM user_subject_access
          WHERE subject = %I.subject AND can_write = true
        )
      )', table_name, table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply to all subject-based tables
SELECT apply_subject_policies('blood_glucose');
SELECT apply_subject_policies('blood_pressure');
SELECT apply_subject_policies('weight_log');
SELECT apply_subject_policies('workouts');
SELECT apply_subject_policies('health_metrics');
SELECT apply_subject_policies('fasting_windows');
SELECT apply_subject_policies('meals');
SELECT apply_subject_policies('lumen_entries');
SELECT apply_subject_policies('lab_results');
SELECT apply_subject_policies('goals');
SELECT apply_subject_policies('scout_progress');
SELECT apply_subject_policies('scout_merit_badges');
SELECT apply_subject_policies('college_prep_log');
SELECT apply_subject_policies('college_prep_timeline');
SELECT apply_subject_policies('family_events');
SELECT apply_subject_policies('school_calendar');
SELECT apply_subject_policies('vehicle_log');
SELECT apply_subject_policies('kids');
SELECT apply_subject_policies('hiking_history');
SELECT apply_subject_policies('personal_hikes');
SELECT apply_subject_policies('inr_readings');
SELECT apply_subject_policies('medications');
SELECT apply_subject_policies('medical_conditions');
SELECT apply_subject_policies('doctor_visits');
SELECT apply_subject_policies('eye_prescriptions');

DROP FUNCTION apply_subject_policies(text);

-- ============================================================
-- 4. UPDATE RLS POLICIES FOR TABLE-BASED TABLES (no subject)
-- ============================================================
-- Finance tables: finance_income, finance_donations, finance_net_worth, finance_tax_profile
-- These only allow access if user_table_access permits

-- Drop old policies
DROP POLICY IF EXISTS "user_select_finance_income" ON finance_income;
DROP POLICY IF EXISTS "user_insert_finance_income" ON finance_income;
DROP POLICY IF EXISTS "user_update_finance_income" ON finance_income;
DROP POLICY IF EXISTS "user_delete_finance_income" ON finance_income;

DROP POLICY IF EXISTS "user_select_finance_donations" ON finance_donations;
DROP POLICY IF EXISTS "user_insert_finance_donations" ON finance_donations;
DROP POLICY IF EXISTS "user_update_finance_donations" ON finance_donations;
DROP POLICY IF EXISTS "user_delete_finance_donations" ON finance_donations;

DROP POLICY IF EXISTS "user_select_finance_net_worth" ON finance_net_worth;
DROP POLICY IF EXISTS "user_insert_finance_net_worth" ON finance_net_worth;
DROP POLICY IF EXISTS "user_update_finance_net_worth" ON finance_net_worth;
DROP POLICY IF EXISTS "user_delete_finance_net_worth" ON finance_net_worth;

DROP POLICY IF EXISTS "user_select_finance_tax_profile" ON finance_tax_profile;
DROP POLICY IF EXISTS "user_insert_finance_tax_profile" ON finance_tax_profile;
DROP POLICY IF EXISTS "user_update_finance_tax_profile" ON finance_tax_profile;
DROP POLICY IF EXISTS "user_delete_finance_tax_profile" ON finance_tax_profile;

DROP POLICY IF EXISTS "user_select_rental_income" ON rental_income;
DROP POLICY IF EXISTS "user_insert_rental_income" ON rental_income;
DROP POLICY IF EXISTS "user_update_rental_income" ON rental_income;
DROP POLICY IF EXISTS "user_delete_rental_income" ON rental_income;

DROP POLICY IF EXISTS "user_select_rental_expenses" ON rental_expenses;
DROP POLICY IF EXISTS "user_insert_rental_expenses" ON rental_expenses;
DROP POLICY IF EXISTS "user_update_rental_expenses" ON rental_expenses;
DROP POLICY IF EXISTS "user_delete_rental_expenses" ON rental_expenses;

-- Create table-level RLS policies
CREATE POLICY "table_select_finance_income" ON finance_income
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_table_access
      WHERE table_name = 'finance_income' AND can_read = true
    )
  );

CREATE POLICY "table_insert_finance_income" ON finance_income
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_table_access
      WHERE table_name = 'finance_income' AND can_write = true
    )
  );

CREATE POLICY "table_update_finance_income" ON finance_income
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_table_access
      WHERE table_name = 'finance_income' AND can_write = true
    )
  );

CREATE POLICY "table_delete_finance_income" ON finance_income
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM user_table_access
      WHERE table_name = 'finance_income' AND can_write = true
    )
  );

-- Helper function for table-level policies
CREATE OR REPLACE FUNCTION apply_table_policies(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    CREATE POLICY "table_select_%s" ON %I
      FOR SELECT USING (
        auth.uid() IN (
          SELECT user_id FROM user_table_access
          WHERE table_name = %L AND can_read = true
        )
      )', table_name, table_name, table_name);

  EXECUTE format('
    CREATE POLICY "table_insert_%s" ON %I
      FOR INSERT WITH CHECK (
        auth.uid() IN (
          SELECT user_id FROM user_table_access
          WHERE table_name = %L AND can_write = true
        )
      )', table_name, table_name, table_name);

  EXECUTE format('
    CREATE POLICY "table_update_%s" ON %I
      FOR UPDATE USING (
        auth.uid() IN (
          SELECT user_id FROM user_table_access
          WHERE table_name = %L AND can_write = true
        )
      )', table_name, table_name, table_name);

  EXECUTE format('
    CREATE POLICY "table_delete_%s" ON %I
      FOR DELETE USING (
        auth.uid() IN (
          SELECT user_id FROM user_table_access
          WHERE table_name = %L AND can_write = true
        )
      )', table_name, table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply to finance and rental tables
SELECT apply_table_policies('finance_income');
SELECT apply_table_policies('finance_donations');
SELECT apply_table_policies('finance_net_worth');
SELECT apply_table_policies('finance_tax_profile');
SELECT apply_table_policies('rental_income');
SELECT apply_table_policies('rental_expenses');

-- Apply to other restricted tables
SELECT apply_table_policies('chat_sessions');
SELECT apply_table_policies('prompt_templates');

DROP FUNCTION apply_table_policies(text);

-- ============================================================
-- 5. THOUGHTS TABLE: Own data only (no subject mapping)
-- ============================================================

DROP POLICY IF EXISTS "user_select_thoughts" ON thoughts;
DROP POLICY IF EXISTS "user_insert_thoughts" ON thoughts;
DROP POLICY IF EXISTS "user_update_thoughts" ON thoughts;
DROP POLICY IF EXISTS "user_delete_thoughts" ON thoughts;

CREATE POLICY "thoughts_select_own" ON thoughts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "thoughts_insert_own" ON thoughts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "thoughts_update_own" ON thoughts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "thoughts_delete_own" ON thoughts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 6. ADMIN HELPER: Grant all permissions (for Umair/parent)
-- ============================================================

CREATE OR REPLACE FUNCTION grant_full_access_to_user(user_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert all subject access
  INSERT INTO user_subject_access (user_id, subject, can_read, can_write)
  VALUES
    (user_id, 'Umair', true, true),
    (user_id, 'Nyel', true, false),
    (user_id, 'Emaad', true, false),
    (user_id, 'Omer', true, false)
  ON CONFLICT (user_id, subject) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write;

  -- Insert all table access (read + write)
  INSERT INTO user_table_access (user_id, table_name, can_read, can_write)
  VALUES
    (user_id, 'blood_glucose', true, true),
    (user_id, 'blood_pressure', true, true),
    (user_id, 'weight_log', true, true),
    (user_id, 'workouts', true, true),
    (user_id, 'health_metrics', true, true),
    (user_id, 'fasting_windows', true, true),
    (user_id, 'meals', true, true),
    (user_id, 'lumen_entries', true, true),
    (user_id, 'lab_results', true, true),
    (user_id, 'goals', true, true),
    (user_id, 'scout_progress', true, true),
    (user_id, 'scout_merit_badges', true, true),
    (user_id, 'college_prep_log', true, true),
    (user_id, 'college_prep_timeline', true, true),
    (user_id, 'family_events', true, true),
    (user_id, 'school_calendar', true, true),
    (user_id, 'vehicle_log', true, true),
    (user_id, 'kids', true, true),
    (user_id, 'hiking_history', true, true),
    (user_id, 'personal_hikes', true, true),
    (user_id, 'inr_readings', true, true),
    (user_id, 'medications', true, true),
    (user_id, 'medical_conditions', true, true),
    (user_id, 'doctor_visits', true, true),
    (user_id, 'eye_prescriptions', true, true),
    (user_id, 'finance_income', true, true),
    (user_id, 'finance_donations', true, true),
    (user_id, 'finance_net_worth', true, true),
    (user_id, 'finance_tax_profile', true, true),
    (user_id, 'rental_income', true, true),
    (user_id, 'rental_expenses', true, true),
    (user_id, 'chat_sessions', true, true),
    (user_id, 'prompt_templates', true, true)
  ON CONFLICT (user_id, table_name) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. CHILD HELPER: Grant restricted access (no finance)
-- ============================================================

CREATE OR REPLACE FUNCTION grant_child_access_to_user(user_id uuid, child_name text)
RETURNS void AS $$
BEGIN
  -- Child can only access their own subject data
  INSERT INTO user_subject_access (user_id, subject, can_read, can_write)
  VALUES (user_id, child_name, true, true)
  ON CONFLICT (user_id, subject) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write;

  -- Child can access non-finance tables only
  INSERT INTO user_table_access (user_id, table_name, can_read, can_write)
  VALUES
    (user_id, 'blood_glucose', true, true),
    (user_id, 'blood_pressure', true, true),
    (user_id, 'weight_log', true, true),
    (user_id, 'workouts', true, true),
    (user_id, 'health_metrics', true, true),
    (user_id, 'fasting_windows', true, true),
    (user_id, 'meals', true, true),
    (user_id, 'lumen_entries', true, true),
    (user_id, 'lab_results', true, true),
    (user_id, 'goals', true, true),
    (user_id, 'scout_progress', true, true),
    (user_id, 'scout_merit_badges', true, true),
    (user_id, 'college_prep_log', true, true),
    (user_id, 'college_prep_timeline', true, true),
    (user_id, 'family_events', true, true),
    (user_id, 'school_calendar', true, true),
    (user_id, 'kids', true, false),  -- read-only
    (user_id, 'chat_sessions', true, true)
    -- Explicitly NOT included: finance_*, rental_*, vehicle_log, inr_readings, medications, medical_conditions, doctor_visits
  ON CONFLICT (user_id, table_name) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write;
END;
$$ LANGUAGE plpgsql;
