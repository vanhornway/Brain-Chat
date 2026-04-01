-- Fix travel_plans and accommodations user_id values
-- Replace UMAIR_UUID with the actual UUID from the seeding step

-- First, let's set user_id for travel_plans where it's NULL or incorrect
-- Assuming Umair's UUID is the primary user, set all travel_plans to their user_id
UPDATE travel_plans
SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778'
WHERE user_id IS NULL OR user_id = '00000000-0000-0000-0000-000000000000';

-- Set accommodations to match their parent travel_plan's user_id
UPDATE accommodations
SET user_id = (
  SELECT tp.user_id
  FROM travel_plans tp
  WHERE tp.id = accommodations.travel_plan_id
)
WHERE user_id IS NULL OR user_id = '00000000-0000-0000-0000-000000000000';

-- Verify the update
SELECT 'travel_plans' as table_name, COUNT(*) as total_rows, COUNT(user_id) as rows_with_user_id
FROM travel_plans
UNION ALL
SELECT 'accommodations', COUNT(*), COUNT(user_id)
FROM accommodations;
