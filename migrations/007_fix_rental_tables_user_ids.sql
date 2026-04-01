-- Fix rental_expenses and rental_income user_id values
-- Set all rental records to Umair's user_id

UPDATE rental_expenses
SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778'
WHERE user_id IS NULL OR user_id = '00000000-0000-0000-0000-000000000000';

UPDATE rental_income
SET user_id = 'acde94f0-4bde-4007-bc3f-69d3ee8ff778'
WHERE user_id IS NULL OR user_id = '00000000-0000-0000-0000-000000000000';

-- Verify the update
SELECT 'rental_expenses' as table_name, COUNT(*) as total_rows, COUNT(user_id) as rows_with_user_id
FROM rental_expenses
UNION ALL
SELECT 'rental_income', COUNT(*), COUNT(user_id)
FROM rental_income;
