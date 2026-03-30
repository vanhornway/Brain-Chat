-- Add user_id column to all tables (if not present) for user isolation
-- This migration enables Row Level Security (RLS) filtering by user

-- Function to add user_id column if it doesn't exist
CREATE OR REPLACE FUNCTION add_user_id_column(table_name text)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = table_name AND column_name = 'user_id'
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE', table_name);
    EXECUTE format('CREATE INDEX idx_%s_user_id ON %I(user_id)', table_name, table_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add user_id to all data tables
SELECT add_user_id_column('blood_glucose');
SELECT add_user_id_column('blood_pressure');
SELECT add_user_id_column('weight_log');
SELECT add_user_id_column('workouts');
SELECT add_user_id_column('fasting_windows');
SELECT add_user_id_column('meals');
SELECT add_user_id_column('health_metrics');
SELECT add_user_id_column('lab_results');
SELECT add_user_id_column('medications');
SELECT add_user_id_column('medical_conditions');
SELECT add_user_id_column('doctor_visits');
SELECT add_user_id_column('eye_prescriptions');
SELECT add_user_id_column('inr_readings');
SELECT add_user_id_column('lumen_entries');

SELECT add_user_id_column('hiking_history');
SELECT add_user_id_column('personal_hikes');

SELECT add_user_id_column('finance_donations');
SELECT add_user_id_column('finance_income');
SELECT add_user_id_column('finance_net_worth');
SELECT add_user_id_column('finance_tax_profile');
SELECT add_user_id_column('rental_income');
SELECT add_user_id_column('rental_expenses');

SELECT add_user_id_column('goals');
SELECT add_user_id_column('thoughts');
SELECT add_user_id_column('vehicle_log');

SELECT add_user_id_column('family_events');
SELECT add_user_id_column('school_calendar');
SELECT add_user_id_column('kids');

SELECT add_user_id_column('college_prep_log');
SELECT add_user_id_column('college_prep_timeline');
SELECT add_user_id_column('scout_progress');
SELECT add_user_id_column('scout_merit_badges');

SELECT add_user_id_column('chat_sessions');
SELECT add_user_id_column('prompt_templates');

-- Enable RLS on all tables
ALTER TABLE blood_glucose ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_pressure ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE eye_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inr_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumen_entries ENABLE ROW LEVEL SECURITY;

ALTER TABLE hiking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_hikes ENABLE ROW LEVEL SECURITY;

ALTER TABLE finance_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_net_worth ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_tax_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_expenses ENABLE ROW LEVEL SECURITY;

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids ENABLE ROW LEVEL SECURITY;

ALTER TABLE college_prep_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_prep_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_merit_badges ENABLE ROW LEVEL SECURITY;

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (SELECT, INSERT, UPDATE, DELETE all check user_id)
-- Template: Create for each table
CREATE OR REPLACE FUNCTION create_rls_policies(table_name text)
RETURNS void AS $$
BEGIN
  -- SELECT policy
  EXECUTE format('DROP POLICY IF EXISTS "user_select_%s" ON %I', table_name, table_name);
  EXECUTE format('CREATE POLICY "user_select_%s" ON %I FOR SELECT USING (auth.uid() = user_id)', table_name, table_name);

  -- INSERT policy
  EXECUTE format('DROP POLICY IF EXISTS "user_insert_%s" ON %I', table_name, table_name);
  EXECUTE format('CREATE POLICY "user_insert_%s" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', table_name, table_name);

  -- UPDATE policy
  EXECUTE format('DROP POLICY IF EXISTS "user_update_%s" ON %I', table_name, table_name);
  EXECUTE format('CREATE POLICY "user_update_%s" ON %I FOR UPDATE USING (auth.uid() = user_id)', table_name, table_name);

  -- DELETE policy
  EXECUTE format('DROP POLICY IF EXISTS "user_delete_%s" ON %I', table_name, table_name);
  EXECUTE format('CREATE POLICY "user_delete_%s" ON %I FOR DELETE USING (auth.uid() = user_id)', table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply policies to all tables
SELECT create_rls_policies('blood_glucose');
SELECT create_rls_policies('blood_pressure');
SELECT create_rls_policies('weight_log');
SELECT create_rls_policies('workouts');
SELECT create_rls_policies('fasting_windows');
SELECT create_rls_policies('meals');
SELECT create_rls_policies('health_metrics');
SELECT create_rls_policies('lab_results');
SELECT create_rls_policies('medications');
SELECT create_rls_policies('medical_conditions');
SELECT create_rls_policies('doctor_visits');
SELECT create_rls_policies('eye_prescriptions');
SELECT create_rls_policies('inr_readings');
SELECT create_rls_policies('lumen_entries');

SELECT create_rls_policies('hiking_history');
SELECT create_rls_policies('personal_hikes');

SELECT create_rls_policies('finance_donations');
SELECT create_rls_policies('finance_income');
SELECT create_rls_policies('finance_net_worth');
SELECT create_rls_policies('finance_tax_profile');
SELECT create_rls_policies('rental_income');
SELECT create_rls_policies('rental_expenses');

SELECT create_rls_policies('goals');
SELECT create_rls_policies('thoughts');
SELECT create_rls_policies('vehicle_log');

SELECT create_rls_policies('family_events');
SELECT create_rls_policies('school_calendar');
SELECT create_rls_policies('kids');

SELECT create_rls_policies('college_prep_log');
SELECT create_rls_policies('college_prep_timeline');
SELECT create_rls_policies('scout_progress');
SELECT create_rls_policies('scout_merit_badges');

SELECT create_rls_policies('chat_sessions');
SELECT create_rls_policies('prompt_templates');

-- Clean up helper functions
DROP FUNCTION IF EXISTS add_user_id_column(text);
DROP FUNCTION IF EXISTS create_rls_policies(text);
