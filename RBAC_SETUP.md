# Role-Based Access Control (RBAC) Setup Guide

## Overview

Brain Chat now features fine-grained access control with three layers:

1. **Subject-Level Access**: Who can see Umair's vs Nyel's data?
2. **Table-Level Access**: Which tables can each user access?
3. **Personal Access**: Thoughts are visible only to the owner

This enables:
- ✅ Parents (Umair) view kids' health data (read-only)
- ✅ Kids (Nyel, Emaad, Omer) see only their own health data
- ✅ Finance tables completely blocked from kids
- ✅ Each family member's thoughts stay private
- ✅ Granular control: read vs read+write access

## Quick Setup (5 minutes)

### 1. Deploy Migrations

```bash
# In Supabase Dashboard → SQL Editor, run both:
# 1. migrations/001_add_user_isolation.sql (from previous step)
# 2. migrations/002_add_role_based_access_control.sql (new)
```

### 2. Create User Accounts

Via Supabase Dashboard → Authentication → Users → **Invite**:
- umair@family.com
- nyel@family.com
- emaad@family.com
- omer@family.com

Get their user IDs after signup.

### 3. Seed Permissions

```bash
# In Supabase Dashboard → SQL Editor:
# Copy scripts/seed-permissions.sql
# Replace UUIDs with actual user IDs
# Run the script
```

### 4. Deploy to Vercel

```bash
git push  # Auto-deploys
```

## How It Works

### Subject-Based Tables

Tables like `blood_glucose`, `scout_progress`, `college_prep_log` have a `subject` column:

```
Query: "What's Nyel's glucose?"
↓
AI calls: query_table('blood_glucose', subject='Nyel')
↓
Backend checks:
  1. Does umair_user have read access to blood_glucose? ✅
  2. Does umair_user have read access to subject 'Nyel'? ✅
↓
RLS filter: WHERE user_id = umair_uuid AND subject = 'Nyel'
↓
Returns: Nyel's glucose readings
```

**Permission Table** (`user_subject_access`):
```
user_id  | subject | can_read | can_write
---------|---------|----------|----------
umair    | Umair   | true     | true
umair    | Nyel    | true     | false    ← Parent can read, not write kids' data
nyel     | Nyel    | true     | true     ← Kid can see only own data
```

### Table-Based Tables

Tables like `finance_income`, `finance_donations` have no `subject` column — access is purely table-level:

```
Query: "Show my net worth"
↓
AI calls: query_table('finance_net_worth')
↓
Backend checks:
  1. Does nyel_user have read access to finance_net_worth? ❌
↓
Rejected: "Access denied: finance_net_worth is restricted"
```

**Permission Table** (`user_table_access`):
```
user_id  | table_name      | can_read | can_write
---------|-----------------|----------|----------
umair    | finance_income  | true     | true
umair    | finance_net_worth| true    | true
nyel     | finance_*       | false    | false     ← Blocked entirely
```

### Personal Tables

`thoughts` table: Each user sees only their own.

```
Query: "Show me my thoughts"
↓
AI calls: query_table('thoughts')
↓
RLS filter: WHERE user_id = auth.uid()
↓
Returns: Only this user's thoughts
```

No `subject` column needed.

## Configuration by Role

### Umair (Parent) - Full Access

```sql
-- Can see and manage own data
user_subject_access: (umair, Umair, read=true, write=true)

-- Can view kids' health/scouting/college data (read-only)
user_subject_access: (umair, Nyel, read=true, write=false)
user_subject_access: (umair, Emaad, read=true, write=false)
user_subject_access: (umair, Omer, read=true, write=false)

-- Can access ALL tables (read+write)
user_table_access: (umair, blood_glucose, read=true, write=true)
user_table_access: (umair, finance_income, read=true, write=true)
... and 30+ other tables
```

Run: `SELECT grant_full_access_to_user('umair-uuid'::uuid);`

### Nyel (Child) - Restricted

```sql
-- Can only see own data
user_subject_access: (nyel, Nyel, read=true, write=true)

-- Can access non-finance tables only
user_table_access: (nyel, blood_glucose, read=true, write=true)
user_table_access: (nyel, scout_progress, read=true, write=true)
user_table_access: (nyel, college_prep_log, read=true, write=true)

-- Explicitly NOT included:
-- - finance_* tables
-- - rental_* tables
-- - Emaad/Omer/Umair subject data
```

Run: `SELECT grant_child_access_to_user('nyel-uuid'::uuid, 'Nyel');`

### Emaad, Omer - Same as Nyel

```bash
# For each child:
SELECT grant_child_access_to_user('emaad-uuid'::uuid, 'Emaad');
SELECT grant_child_access_to_user('omer-uuid'::uuid, 'Omer');
```

## Customization Examples

### Allow Nyel to See Emaad's Scout Data

```sql
INSERT INTO user_subject_access (user_id, subject, can_read, can_write)
VALUES ('nyel-uuid', 'Emaad', true, false)
ON CONFLICT (user_id, subject) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_write = EXCLUDED.can_write;
```

### Give Umair Write Access to Kids' Health Data

```sql
UPDATE user_subject_access
SET can_write = true
WHERE user_id = 'umair-uuid' AND subject IN ('Nyel', 'Emaad', 'Omer');
```

### Block Read Access to Vehicle Log

```sql
INSERT INTO user_table_access (user_id, table_name, can_read, can_write)
VALUES ('nyel-uuid', 'vehicle_log', false, false)
ON CONFLICT (user_id, table_name) DO UPDATE SET
  can_read = false,
  can_write = false;
```

## Querying with Subject

When AI queries subject-based tables, it must specify the subject:

### ✅ Correct (Parent viewing child data)

```typescript
query_table('blood_glucose', subject='Nyel')
query_table('scout_progress', subject='Emaad')
query_table('college_prep_log', subject='Omer')
```

### ✅ Correct (User viewing own data)

```typescript
query_table('blood_glucose', subject='Umair')  // Umair sees own data
query_table('blood_glucose', subject='Nyel')   // Nyel sees own data
```

### ❌ Incorrect

```typescript
query_table('blood_glucose')  // No subject specified
// → Rejected: missing required subject parameter
```

## UI/UX Implications

### Subject Dropdown (Frontend Improvement)

For parent, show dropdown of accessible subjects:

```typescript
const accessibleSubjects = await getUserAccessibleSubjects(userId, 'read');
// Returns: ['Umair', 'Nyel', 'Emaad', 'Omer']
// User selects subject before querying health data
```

For child, show only own subject:

```typescript
const accessibleSubjects = await getUserAccessibleSubjects(childUserId, 'read');
// Returns: ['Nyel']
```

### Access Denied UI

If user tries querying blocked table:

```
User: "Show me my net worth"
AI: "You don't have access to finance_net_worth. Contact the admin for permission."
```

## Troubleshooting

### "Access denied to finance_income"

- User is not Umair
- Check `user_table_access` for that user → finance_income row
- If missing, add: `INSERT INTO user_table_access (user_id, table_name, can_read, can_write) VALUES (..., 'finance_income', true, true)`

### "No read access to subject 'Emaad'"

- User doesn't have `user_subject_access` row for Emaad
- Or: `can_read = false`
- Add row: `INSERT INTO user_subject_access (user_id, subject, can_read, can_write) VALUES (..., 'Emaad', true, false)`

### RLS Policy Error at Database

```
ERROR: new row violates row-level security policy
```

Means: Backend code is trying to insert with wrong user_id or subject. This is expected — RLS is working.

Check:
1. Is the subject in `user_subject_access` with `can_write=true`?
2. Is the table in `user_table_access` with `can_write=true`?

### Performance (Permission Checks)

Permission checks use indexed queries:
```sql
CREATE INDEX idx_user_subject_access_user_id ON user_subject_access(user_id);
CREATE INDEX idx_user_table_access_user_id ON user_table_access(user_id);
```

Latency: ~10-50ms per query (acceptable).

## Security Notes

- **Two-layer enforcement**: Backend checks + RLS policies
- **No escalation**: Even if backend has bug, RLS prevents unauthorized access
- **Audit-friendly**: All access logged via Supabase
- **Easy revocation**: Delete rows from permission tables to revoke access

## Advanced: Custom Roles

Beyond parent/child, you could add roles:

```sql
-- Create a roles table
CREATE TABLE user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text  -- 'parent', 'child', 'admin'
);

-- Seed permissions based on role
INSERT INTO user_table_access (user_id, table_name, can_read, can_write)
SELECT user_id, 'finance_income', true, true
FROM user_roles
WHERE role = 'parent';
```

## References

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Backend Permission Helpers](./lib/permissions.ts)
- [Migration Scripts](./migrations/)
- [Seed Script](./scripts/seed-permissions.sql)
