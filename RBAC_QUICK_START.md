# RBAC Quick Start (Copy-Paste Ready)

## Step 1: Deploy Migration

Open Supabase Dashboard → SQL Editor → paste this entire migration:

**File**: `migrations/002_add_role_based_access_control.sql`

Click **Run** (takes ~10 seconds).

## Step 2: Create Family Accounts

Supabase Dashboard → Authentication → Users → **Invite**

Invite each family member:
```
umair@family.com
nyel@family.com
emaad@family.com
omer@family.com
```

They'll get email links to set passwords.

**After each person signs up**, note their **User ID**:
- Supabase Dashboard → Authentication → Users → click user → copy **ID** field

You'll have 4 UUIDs:
```
Umair: 00000000-0000-0000-0000-000000000001
Nyel:  00000000-0000-0000-0000-000000000002
Emaad: 00000000-0000-0000-0000-000000000003
Omer:  00000000-0000-0000-0000-000000000004
```

## Step 3: Seed Permissions

### Option A: SQL (Recommended)

1. Open Supabase SQL Editor
2. Paste the SQL below (replace UUIDs with yours):

```sql
-- REPLACE THESE WITH YOUR ACTUAL USER IDS
\set umair_id '00000000-0000-0000-0000-000000000001'
\set nyel_id '00000000-0000-0000-0000-000000000002'
\set emaad_id '00000000-0000-0000-0000-000000000003'
\set omer_id '00000000-0000-0000-0000-000000000004'

-- UMAIR: Full access
SELECT grant_full_access_to_user(:'umair_id'::uuid);
UPDATE user_subject_access SET can_write = false
WHERE user_id = :'umair_id'::uuid AND subject IN ('Nyel', 'Emaad', 'Omer');

-- NYEL: Restricted (no finance)
SELECT grant_child_access_to_user(:'nyel_id'::uuid, 'Nyel');

-- EMAAD: Restricted (no finance)
SELECT grant_child_access_to_user(:'emaad_id'::uuid, 'Emaad');

-- OMER: Restricted (no finance)
SELECT grant_child_access_to_user(:'omer_id'::uuid, 'Omer');

-- VERIFY
SELECT 'Subjects' as type;
SELECT user_id, subject, can_read, can_write FROM user_subject_access;

SELECT 'Tables' as type;
SELECT user_id, table_name, can_read, can_write FROM user_table_access;
```

3. Replace UUIDs (copy-paste from Supabase Users list)
4. Click **Run**
5. Check **Verify** output — should show all permissions

### Option B: TypeScript (If You Prefer)

```bash
# In your Vercel environment variables, add:
ADMIN_SETUP_KEY=your-secret-key

# Then POST to:
curl -X POST http://localhost:3000/api/admin/setup-permissions \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "your-secret-key",
    "family": [
      { "email": "umair@family.com", "userId": "uuid-1", "name": "Umair", "role": "parent" },
      { "email": "nyel@family.com", "userId": "uuid-2", "name": "Nyel", "role": "child" },
      { "email": "emaad@family.com", "userId": "uuid-3", "name": "Emaad", "role": "child" },
      { "email": "omer@family.com", "userId": "uuid-4", "name": "Omer", "role": "child" }
    ]
  }'
```

## Step 4: Test

```bash
# Deploy to Vercel
git push

# Test in production
# Visit your Vercel URL
# Login as umair@family.com
# Should see full access to all data

# Login as nyel@family.com
# Try asking: "What's my glucose?"
# ✅ Works (can see own data)

# Try asking: "Show me my net worth"
# ❌ Denied (finance is restricted)

# Try asking: "What's Umair's net worth?"
# ❌ Denied (can't see other subjects in finance tables)
```

## Access Matrix (What You Just Configured)

| User | Own Subject | Other Subjects | Finance | Scout | College | Health |
|------|-------------|----------------|---------|-------|---------|--------|
| Umair | R+W | R only | R+W | R+W | R+W | R+W |
| Nyel | R+W | ❌ | ❌ | R+W | R+W | R+W |
| Emaad | R+W | ❌ | ❌ | R+W | R+W | R+W |
| Omer | R+W | ❌ | ❌ | R+W | R+W | R+W |

R = Read, W = Write, ❌ = Blocked

## Modify Permissions Later

### Let Umair See Finance

Already done (see Step 3).

### Let Nyel Read (but not write) Emaad's Scout Data

```sql
INSERT INTO user_subject_access (user_id, subject, can_read, can_write)
VALUES ('nyel-uuid', 'Emaad', true, false)
ON CONFLICT (user_id, subject) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_write = EXCLUDED.can_write;
```

### Block Nyel from Health Tables Entirely

```sql
UPDATE user_table_access
SET can_read = false, can_write = false
WHERE user_id = 'nyel-uuid' AND table_name LIKE 'health%';
```

### Give Parent Write Access to Kids' Health Data

```sql
UPDATE user_subject_access
SET can_write = true
WHERE user_id = 'umair-uuid' AND subject IN ('Nyel', 'Emaad', 'Omer');
```

## Troubleshooting

### "Grant functions not found"

Migration didn't run. Go back to Step 1 and run the SQL migration.

### "No permissions found for user"

User not in `user_subject_access` or `user_table_access` tables. Re-run seeding script.

### Child can see parent's finance data

Umair's subject access includes `can_write=true`. That's a write permission issue, not read. Child shouldn't have any row for finance tables.

Check:
```sql
SELECT * FROM user_table_access WHERE table_name LIKE 'finance%';
-- Should show no rows for child users
```

### Slow permission checks

Indexes might not have built. Run:

```sql
CREATE INDEX IF NOT EXISTS idx_user_subject_access_user_id ON user_subject_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_table_access_user_id ON user_table_access(user_id);
```

## Next: Frontend Improvements

With RBAC in place, you can enhance the UI:

1. **Subject Selector** (for parent viewing different kids' data)
   - Query `getUserAccessibleSubjects(userId)` to populate dropdown
   - User selects subject before asking health questions

2. **Permission-Aware Shortcuts**
   - Hide "Finance Snapshot" if user is child
   - Show only accessible scout/college data

3. **Error Messages**
   - "You don't have access to finance tables. Contact admin."

See `lib/permissions.ts` for helper functions.

## References

- **Full RBAC Guide**: [RBAC_SETUP.md](./RBAC_SETUP.md)
- **Permission Helpers**: `lib/permissions.ts`
- **Database Schema**: `migrations/002_add_role_based_access_control.sql`
