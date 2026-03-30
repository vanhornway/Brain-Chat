-- Populate user_id for Nyel's data (scout and college tables use kid_name)
UPDATE scout_progress SET user_id = '331446e6-66a1-4a57-bbe2-7663936397e7' WHERE kid_name = 'Nyel';
UPDATE scout_merit_badges SET user_id = '331446e6-66a1-4a57-bbe2-7663936397e7' WHERE kid_name = 'Nyel';
UPDATE college_prep_log SET user_id = '331446e6-66a1-4a57-bbe2-7663936397e7' WHERE kid_name = 'Nyel';
UPDATE college_prep_timeline SET user_id = '331446e6-66a1-4a57-bbe2-7663936397e7' WHERE kid_name = 'Nyel';

-- Populate user_id for Emaad's data
UPDATE scout_progress SET user_id = '96fd0d93-c2cc-482b-bbd9-c4abde005fe9' WHERE kid_name = 'Emaad';
UPDATE scout_merit_badges SET user_id = '96fd0d93-c2cc-482b-bbd9-c4abde005fe9' WHERE kid_name = 'Emaad';
UPDATE college_prep_log SET user_id = '96fd0d93-c2cc-482b-bbd9-c4abde005fe9' WHERE kid_name = 'Emaad';
UPDATE college_prep_timeline SET user_id = '96fd0d93-c2cc-482b-bbd9-c4abde005fe9' WHERE kid_name = 'Emaad';

-- Set all remaining NULL user_ids to Umair (most data is his)
UPDATE blood_glucose SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE blood_pressure SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE weight_log SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE workouts SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE health_metrics SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE fasting_windows SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE meals SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE lumen_entries SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE lab_results SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE inr_readings SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE medications SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE medical_conditions SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE doctor_visits SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE eye_prescriptions SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE goals SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE hiking_history SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE personal_hikes SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE vehicle_log SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE family_events SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE finance_income SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE finance_donations SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE finance_net_worth SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE finance_tax_profile SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE thoughts SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
UPDATE chat_sessions SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778' WHERE user_id IS NULL;
