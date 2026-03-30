# Authentication & Authorization Setup

## Overview

Brain Chat now requires authentication and implements Row Level Security (RLS) to ensure each family member can only access their own data.

**Security improvements**:
- ✅ Login required to access app
- ✅ API routes protected (middleware checks auth before allowing requests)
- ✅ Database queries filtered by `user_id` on backend
- ✅ RLS policies enforce user isolation at database level
- ✅ All data operations (insert, query, search) scoped to authenticated user

## Setup Steps

### 1. Run Database Migration

Login to Supabase dashboard → SQL Editor → paste content of `migrations/001_add_user_isolation.sql` → Run

This will:
- Add `user_id` column to all 30+ tables
- Enable RLS on all tables
- Create policies that restrict SELECT, INSERT, UPDATE, DELETE to authenticated user only

### 2. Enable Supabase Auth in Your Project

1. Go to Supabase Dashboard → Authentication → Settings
2. Under **Email Auth**:
   - ✅ Enable email & password (enabled by default)
   - Set "Confirm email" to **OFF** if you want instant signup (optional)
   - Set "Auto-confirm user" to **ON** if email confirmation not needed

3. Under **Email Settings**:
   - Configure your email provider (SendGrid, Mailgun, or built-in)
   - Recommended: Use built-in for testing, switch to SendGrid/Mailgun for production

### 3. Configure Environment Variables

In Vercel (or your hosting platform), add:

```bash
# Already present (don't change)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc... (service role key, server-side only)

# Optional (for production)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

The app will work locally without these if using `localhost:3000`.

### 4. Deploy to Vercel

```bash
git push  # triggers auto-deploy
# OR manually via Vercel dashboard
```

## Inviting Family Members

### Option 1: Manual Invite (Recommended)

1. Open Supabase Dashboard → Authentication → Users
2. Click **Invite** button
3. Enter family member's email
4. They receive email with sign-up link
5. They create password and start using app

### Option 2: Self-Sign-Up

1. Share app URL with family members
2. They click **Sign Up** on login page
3. Enter email + password → account created
4. ⚠️ **Warning**: If email confirmation is OFF, anyone with email access can sign up. Consider adding allowlist.

### Option 3: Email Allowlist (Recommended for Privacy)

To restrict signups to specific email domains:

1. Create Supabase Function (Dashboard → Edge Functions)
2. Trigger: `on_auth_user_created`
3. Logic:
   ```typescript
   if (!email.endsWith("@yourfamily.com")) {
     throw new Error("Only family emails allowed");
   }
   ```

## Testing Auth

### Local Testing

```bash
npm run dev
# Visit http://localhost:3000
# Redirects to /login if not authenticated
# Try signing up with test@example.com / password123
```

### Vercel Testing

1. Deploy to Vercel
2. Visit your Vercel URL
3. Login with test account
4. Check that:
   - API calls include auth headers
   - No data leaks between users (test with 2 users)

## Data Migration

If you have existing data (before adding `user_id`):

1. Login as first family member
2. Re-insert/upload data through the app
3. All new inserts will auto-populate `user_id`

OR use Supabase SQL:

```sql
-- Set user_id for all rows in a table (use first/only user)
UPDATE blood_glucose SET user_id = 'user-uuid-here' WHERE user_id IS NULL;
UPDATE blood_pressure SET user_id = 'user-uuid-here' WHERE user_id IS NULL;
-- ... repeat for each table
```

Get user UUID from Supabase Dashboard → Users → copy ID field.

## Troubleshooting

### "Unauthorized" Error on Chat API

- Browser session expired
- Try logging out and back in
- Clear browser localStorage

### RLS Policy Errors

```
Error: new row violates row-level security policy
```

Means: Trying to insert/update data with wrong `user_id`. This is working as intended — data is isolated.

### Emails Not Sending

- Check Supabase Auth Logs (Dashboard → Authentication → Auth Users)
- Confirm email provider configured (SendGrid, Mailgun, or built-in)
- Check spam folder

### Can't Sign Up

- Verify auth is enabled in Supabase
- Check email allowlist if configured
- See error message in browser DevTools → Console

## Security Notes

- **Service key is server-side only**: Never expose `SUPABASE_SERVICE_KEY` to frontend
- **RLS is enforced by database**: Even if backend code has a bug, database policies prevent data leaks
- **Auth tokens in cookies**: Auto-managed by middleware
- **API routes are protected**: Middleware rejects requests without valid session

## Advanced: Custom User Attributes

To track additional user info (e.g., family member name, role):

1. Create `user_profiles` table with metadata
2. Link to `auth.users` via `user_id`
3. Query in API routes to personalize experience

Example:
```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text,
  role text, -- 'self', 'spouse', 'child'
  avatar_url text,
  created_at timestamp default now()
);
```

## Rollback (Remove Auth)

To revert to public access:

1. Delete `migrations/001_add_user_isolation.sql`
2. Disable RLS: `ALTER TABLE [table] DISABLE ROW LEVEL SECURITY;`
3. Drop `user_id` columns
4. Remove middleware.ts
5. Delete login page

⚠️ **Not recommended** — RLS provides important security.

## References

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
