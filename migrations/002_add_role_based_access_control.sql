-- Role-Based Access Control (RBAC) + Subject-Level Access
-- Permission tables only. Backend API handles complex permission checks.

-- ============================================================
-- 0. CLEANUP: Drop old policies if they exist
-- ============================================================

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

DROP POLICY IF EXISTS "user_select_chat_sessions" ON chat_sessions;
DROP POLICY IF EXISTS "user_insert_chat_sessions" ON chat_sessions;
DROP POLICY IF EXISTS "user_update_chat_sessions" ON chat_sessions;
DROP POLICY IF EXISTS "user_delete_chat_sessions" ON chat_sessions;

DROP POLICY IF EXISTS "user_select_prompt_templates" ON prompt_templates;
DROP POLICY IF EXISTS "user_insert_prompt_templates" ON prompt_templates;
DROP POLICY IF EXISTS "user_update_prompt_templates" ON prompt_templates;
DROP POLICY IF EXISTS "user_delete_prompt_templates" ON prompt_templates;

DROP POLICY IF EXISTS "user_select_thoughts" ON thoughts;
DROP POLICY IF EXISTS "user_insert_thoughts" ON thoughts;
DROP POLICY IF EXISTS "user_update_thoughts" ON thoughts;
DROP POLICY IF EXISTS "user_delete_thoughts" ON thoughts;

-- ============================================================
-- 1. PERMISSION TABLES
-- ============================================================

CREATE TABLE user_subject_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  can_read boolean DEFAULT true,
  can_write boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, subject)
);

CREATE TABLE user_table_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  can_read boolean DEFAULT false,
  can_write boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, table_name)
);

CREATE INDEX idx_user_subject_access_user_id ON user_subject_access(user_id);
CREATE INDEX idx_user_subject_access_subject ON user_subject_access(subject);
CREATE INDEX idx_user_table_access_user_id ON user_table_access(user_id);
CREATE INDEX idx_user_table_access_table ON user_table_access(table_name);

ALTER TABLE user_subject_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_table_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_subject_access" ON user_subject_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_read_own_table_access" ON user_table_access FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 2. SIMPLE RLS: Filter by user_id. Backend handles logic.
-- ============================================================

CREATE POLICY "user_select_blood_glucose" ON blood_glucose FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_blood_glucose" ON blood_glucose FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_blood_glucose" ON blood_glucose FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_blood_glucose" ON blood_glucose FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_blood_pressure" ON blood_pressure FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_blood_pressure" ON blood_pressure FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_blood_pressure" ON blood_pressure FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_blood_pressure" ON blood_pressure FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_weight_log" ON weight_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_weight_log" ON weight_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_weight_log" ON weight_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_weight_log" ON weight_log FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_workouts" ON workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_workouts" ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_workouts" ON workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_workouts" ON workouts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_health_metrics" ON health_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_health_metrics" ON health_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_health_metrics" ON health_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_health_metrics" ON health_metrics FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_fasting_windows" ON fasting_windows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_fasting_windows" ON fasting_windows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_fasting_windows" ON fasting_windows FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_fasting_windows" ON fasting_windows FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_meals" ON meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_meals" ON meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_meals" ON meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_meals" ON meals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_lumen_entries" ON lumen_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_lumen_entries" ON lumen_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_lumen_entries" ON lumen_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_lumen_entries" ON lumen_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_lab_results" ON lab_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_lab_results" ON lab_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_lab_results" ON lab_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_lab_results" ON lab_results FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_goals" ON goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_scout_progress" ON scout_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_scout_progress" ON scout_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_scout_progress" ON scout_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_scout_progress" ON scout_progress FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_scout_merit_badges" ON scout_merit_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_scout_merit_badges" ON scout_merit_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_scout_merit_badges" ON scout_merit_badges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_scout_merit_badges" ON scout_merit_badges FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_college_prep_log" ON college_prep_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_college_prep_log" ON college_prep_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_college_prep_log" ON college_prep_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_college_prep_log" ON college_prep_log FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_college_prep_timeline" ON college_prep_timeline FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_college_prep_timeline" ON college_prep_timeline FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_college_prep_timeline" ON college_prep_timeline FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_college_prep_timeline" ON college_prep_timeline FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_family_events" ON family_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_family_events" ON family_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_family_events" ON family_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_family_events" ON family_events FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_school_calendar" ON school_calendar FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_school_calendar" ON school_calendar FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_school_calendar" ON school_calendar FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_school_calendar" ON school_calendar FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_vehicle_log" ON vehicle_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_vehicle_log" ON vehicle_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_vehicle_log" ON vehicle_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_vehicle_log" ON vehicle_log FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_kids" ON kids FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_kids" ON kids FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_kids" ON kids FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_kids" ON kids FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_hiking_history" ON hiking_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_hiking_history" ON hiking_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_hiking_history" ON hiking_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_hiking_history" ON hiking_history FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_personal_hikes" ON personal_hikes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_personal_hikes" ON personal_hikes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_personal_hikes" ON personal_hikes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_personal_hikes" ON personal_hikes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_inr_readings" ON inr_readings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_inr_readings" ON inr_readings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_inr_readings" ON inr_readings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_inr_readings" ON inr_readings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_medications" ON medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_medications" ON medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_medications" ON medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_medications" ON medications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_medical_conditions" ON medical_conditions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_medical_conditions" ON medical_conditions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_medical_conditions" ON medical_conditions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_medical_conditions" ON medical_conditions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_doctor_visits" ON doctor_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_doctor_visits" ON doctor_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_doctor_visits" ON doctor_visits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_doctor_visits" ON doctor_visits FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_eye_prescriptions" ON eye_prescriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_eye_prescriptions" ON eye_prescriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_eye_prescriptions" ON eye_prescriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_eye_prescriptions" ON eye_prescriptions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_finance_income" ON finance_income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_finance_income" ON finance_income FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_finance_income" ON finance_income FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_finance_income" ON finance_income FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_finance_donations" ON finance_donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_finance_donations" ON finance_donations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_finance_donations" ON finance_donations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_finance_donations" ON finance_donations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_finance_net_worth" ON finance_net_worth FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_finance_net_worth" ON finance_net_worth FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_finance_net_worth" ON finance_net_worth FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_finance_net_worth" ON finance_net_worth FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_finance_tax_profile" ON finance_tax_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_finance_tax_profile" ON finance_tax_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_finance_tax_profile" ON finance_tax_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_finance_tax_profile" ON finance_tax_profile FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_rental_income" ON rental_income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_rental_income" ON rental_income FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_rental_income" ON rental_income FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_rental_income" ON rental_income FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_rental_expenses" ON rental_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_rental_expenses" ON rental_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_rental_expenses" ON rental_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_rental_expenses" ON rental_expenses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_chat_sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_chat_sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_chat_sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_chat_sessions" ON chat_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_prompt_templates" ON prompt_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_prompt_templates" ON prompt_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_prompt_templates" ON prompt_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_prompt_templates" ON prompt_templates FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_select_thoughts" ON thoughts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_insert_thoughts" ON thoughts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_thoughts" ON thoughts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_delete_thoughts" ON thoughts FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION grant_full_access_to_user(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO user_subject_access (user_id, subject, can_read, can_write)
  VALUES
    (p_user_id, 'Umair', true, true),
    (p_user_id, 'Nyel', true, false),
    (p_user_id, 'Emaad', true, false),
    (p_user_id, 'Omer', true, false)
  ON CONFLICT (user_id, subject) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write;

  INSERT INTO user_table_access (user_id, table_name, can_read, can_write)
  VALUES
    (p_user_id, 'blood_glucose', true, true),
    (p_user_id, 'blood_pressure', true, true),
    (p_user_id, 'weight_log', true, true),
    (p_user_id, 'workouts', true, true),
    (p_user_id, 'health_metrics', true, true),
    (p_user_id, 'fasting_windows', true, true),
    (p_user_id, 'meals', true, true),
    (p_user_id, 'lumen_entries', true, true),
    (p_user_id, 'lab_results', true, true),
    (p_user_id, 'goals', true, true),
    (p_user_id, 'scout_progress', true, true),
    (p_user_id, 'scout_merit_badges', true, true),
    (p_user_id, 'college_prep_log', true, true),
    (p_user_id, 'college_prep_timeline', true, true),
    (p_user_id, 'family_events', true, true),
    (p_user_id, 'school_calendar', true, true),
    (p_user_id, 'vehicle_log', true, true),
    (p_user_id, 'kids', true, true),
    (p_user_id, 'hiking_history', true, true),
    (p_user_id, 'personal_hikes', true, true),
    (p_user_id, 'inr_readings', true, true),
    (p_user_id, 'medications', true, true),
    (p_user_id, 'medical_conditions', true, true),
    (p_user_id, 'doctor_visits', true, true),
    (p_user_id, 'eye_prescriptions', true, true),
    (p_user_id, 'finance_income', true, true),
    (p_user_id, 'finance_donations', true, true),
    (p_user_id, 'finance_net_worth', true, true),
    (p_user_id, 'finance_tax_profile', true, true),
    (p_user_id, 'rental_income', true, true),
    (p_user_id, 'rental_expenses', true, true),
    (p_user_id, 'chat_sessions', true, true),
    (p_user_id, 'prompt_templates', true, true)
  ON CONFLICT (user_id, table_name) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION grant_child_access_to_user(p_user_id uuid, p_child_name text)
RETURNS void AS $$
BEGIN
  INSERT INTO user_subject_access (user_id, subject, can_read, can_write)
  VALUES (p_user_id, p_child_name, true, true)
  ON CONFLICT (user_id, subject) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write;

  INSERT INTO user_table_access (user_id, table_name, can_read, can_write)
  VALUES
    (p_user_id, 'blood_glucose', true, true),
    (p_user_id, 'blood_pressure', true, true),
    (p_user_id, 'weight_log', true, true),
    (p_user_id, 'workouts', true, true),
    (p_user_id, 'health_metrics', true, true),
    (p_user_id, 'fasting_windows', true, true),
    (p_user_id, 'meals', true, true),
    (p_user_id, 'lumen_entries', true, true),
    (p_user_id, 'lab_results', true, true),
    (p_user_id, 'goals', true, true),
    (p_user_id, 'scout_progress', true, true),
    (p_user_id, 'scout_merit_badges', true, true),
    (p_user_id, 'college_prep_log', true, true),
    (p_user_id, 'college_prep_timeline', true, true),
    (p_user_id, 'family_events', true, true),
    (p_user_id, 'school_calendar', true, true),
    (p_user_id, 'kids', true, false),
    (p_user_id, 'chat_sessions', true, true)
  ON CONFLICT (user_id, table_name) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write;
END;
$$ LANGUAGE plpgsql;
