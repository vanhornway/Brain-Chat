import { createClient } from "@supabase/supabase-js";

// Lazily create the client so the module doesn't throw at import time
// (e.g. during Next.js build without env vars set).
let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  _supabase = createClient(url, key);
  return _supabase;
}

// Named export for convenience — only use in client components or server code
// where env vars are guaranteed to be present.
export const supabase = {
  get client() {
    return getSupabaseClient();
  },
};

// All known tables
export const KNOWN_TABLES = [
  "hiking_history",
  "personal_hikes",
  "blood_glucose",
  "blood_pressure",
  "college_prep_log",
  "college_prep_timeline",
  "diet_log",
  "doctor_visits",
  "eye_prescriptions",
  "family_events",
  "fasting_windows",
  "finance_donations",
  "finance_income",
  "finance_net_worth",
  "finance_tax_profile",
  "goals",
  "health_metrics",
  "inr_readings",
  "kids",
  "lab_results",
  "lumen_entries",
  "meals",
  "medical_conditions",
  "medications",
  "school_calendar",
  "scout_merit_badges",
  "scout_progress",
  "thoughts",
  "vehicle_log",
  "weight_log",
  "workouts",
] as const;

export type KnownTable = (typeof KNOWN_TABLES)[number];

// Primary date column per table (verified against actual schema)
export const DATE_COLUMNS: Record<string, string[]> = {
  hiking_history:       ["hike_date", "created_at"],
  personal_hikes:       ["activity_date", "created_at"],
  blood_glucose:        ["recorded_at", "created_at"],
  blood_pressure:       ["recorded_at", "created_at"],
  college_prep_log:     ["created_at"],
  college_prep_timeline:["deadline_date", "completed_date", "created_at"],
  diet_log:             ["created_at"],
  doctor_visits:        ["visit_date", "created_at"],
  eye_prescriptions:    ["exam_date", "created_at"],
  family_events:        ["event_date", "created_at"],
  fasting_windows:      ["fast_start", "created_at"],
  finance_donations:    ["donation_date", "created_at"],
  finance_income:       ["created_at"],
  finance_net_worth:    ["created_at"],
  finance_tax_profile:  ["updated_at"],
  goals:                ["target_date", "updated_at"],
  health_metrics:       ["recorded_at", "created_at"],
  inr_readings:         ["created_at"],
  kids:                 ["updated_at"],
  lab_results:          ["test_date", "created_at"],
  lumen_entries:        ["recorded_at", "created_at"],
  meals:                ["eaten_at", "created_at"],
  medical_conditions:   ["diagnosed_date", "created_at"],
  medications:          ["start_date", "created_at"],
  school_calendar:      ["start_date", "created_at"],
  scout_merit_badges:   ["completed_date", "created_at"],
  scout_progress:       ["as_of_date", "updated_at"],
  thoughts:             ["created_at"],
  vehicle_log:          ["log_date", "created_at"],
  weight_log:           ["recorded_at", "created_at"],
  workouts:             ["workout_date", "created_at"],
};

// Key columns per table — helps the AI know what to filter/display
export const TABLE_SCHEMA: Record<string, string> = {
  hiking_history:        "id, hike_date, season, hike_number, trail_name, attended, hr_avg, hr_max, athlete_count, kudoers, cafe_name, notes",
  personal_hikes:        "id, activity_date, activity_name, activity_type, distance_km, elevation_m, duration_minutes, hr_avg, hr_max, kudos_count",
  blood_glucose:         "id, subject, recorded_at, glucose_mg_dl, a1c_percent, reading_type, fasting, trend, notes",
  blood_pressure:        "id, subject, recorded_at, systolic, diastolic, heart_rate_bpm, notes",
  weight_log:            "id, subject, recorded_at, weight_lbs, weight_kg, body_fat_pct, bmi, fasting_hours",
  workouts:              "id, subject, workout_date, activity_type, duration_minutes, intensity, calories_burned, hr_avg, hr_max, distance_km",
  fasting_windows:       "id, subject, fast_start, fast_end, duration_hours, fast_type, broken_with, notes",
  meals:                 "id, subject, meal_name, eaten_at, meal_type, calories, carbs_g, protein_g, fat_g",
  lumen_entries:         "id, subject, recorded_at, score, interpretation, measurement_context, co2_ppm",
  health_metrics:        "id, subject, recorded_at, metric_type, value, unit",
  lab_results:           "id, subject, test_date, panel, marker, value, unit, reference_low, reference_high, is_flagged, flag",
  medications:           "id, subject, drug_name, dose, frequency, condition, start_date, end_date, is_active",
  medical_conditions:    "id, subject, condition_name, category, diagnosed_date, status, severity",
  eye_prescriptions:     "id, subject, exam_date, lens_type, od_sphere, od_cylinder, os_sphere, os_cylinder, pd_binocular",
  doctor_visits:         "id, subject, visit_date, doctor_name, specialty, reason, findings, bp_systolic, bp_diastolic, weight_lbs",
  goals:                 "id, subject, category, title, description, target_value, current_value, unit, target_date, status, priority",
  thoughts:              "id, subject, content, domain, tags, created_at",
  vehicle_log:           "id, vehicle, log_date, log_type, title, description, cost_usd, mileage, vendor",
  finance_donations:     "id, donation_date, tax_year, charity_name, donation_type, giving_category, amount, is_tax_deductible, islamic_year",
  finance_income:        "id, tax_year, source, amount, notes",
  finance_net_worth:     "id, recorded_at, total_assets, total_liabilities, net_worth, notes",
  finance_tax_profile:   "id, tax_year, filing_status, estimated_gross_income, estimated_agi, estimated_federal_tax, marginal_rate, effective_rate",
  kids:                  "id, name, nickname, grade, school, graduation_year, birth_year, notes",
  school_calendar:       "id, school, people, school_year, event_type, title, start_date, end_date, is_no_school",
  scout_progress:        "id, kid_name, current_rank, rank_date, merit_badges_completed, eagle_required_badges_done, camping_nights, hiking_miles, service_hours, as_of_date",
  scout_merit_badges:    "id, kid_name, badge_name, is_eagle_required, completed_date, counselor",
  college_prep_log:      "id, kid_name, activity_type, title, description, created_at",
  college_prep_timeline: "id, kid_name, phase, task, deadline_date, status, priority, completed_date",
  family_events:         "id, event_date, title, category, people, location, status",
};
