# Troubleshooting Guide

## ✅ Current Status Check

### 1. Database Schema ✅ DONE
You got the "policy already exists" error, which means:
- ✅ Tables are created (`profiles`, `issued_credentials`)
- ✅ RLS policies are set up
- ✅ Indexes are created
- **No action needed** - your database is ready!

### 2. Edge Function Deployment ⚠️ NEEDS CHECKING

**Current Issue**: 401 Unauthorized on signup

**Cause**: Edge function not deployed or not responding

**Fix**:
1. Go to **Make settings page** (gear icon)
2. Find **Supabase** section
3. Click **"Deploy edge function"** or **"Redeploy"**
4. Wait 10-30 seconds for deployment
5. Refresh the signup page

**How to verify**: 
- Reload the signup page
- Look at the banner color:
  - 🔴 **Red banner** = Server offline (not deployed)
  - 🟡 **Yellow banner** = Server online (deployed ✅)

### 3. Storage Bucket 🔄 AUTO-CREATED

The storage bucket is automatically created when the edge function starts.

**Bucket name**: `make-93e10323-credentials`

**How to verify**:
1. Open Supabase Dashboard
2. Go to **Storage**
3. Look for bucket: `make-93e10323-credentials`
4. Should be **Public** with 10MB limit

If not there, it will be created on first edge function startup.

---

## Common Errors & Solutions

### Error: "401 Unauthorized" on Signup

**Symptoms**:
```
POST .../auth/signup 401 (Unauthorized)
```

**Causes & Fixes**:

1. **Edge function not deployed**
   - Go to Make settings → Deploy edge function
   - Wait for deployment confirmation

2. **Edge function deployed but crashed**
   - Go to Supabase Dashboard → Edge Functions
   - Click on your function
   - Check **Logs** tab for errors

3. **Service role key not set**
   - This should be auto-configured by Make
   - Verify in Supabase Dashboard → Settings → API

---

### Error: "policy already exists" in SQL Editor

**This is GOOD!** ✅

It means you've already run the schema. Your database is set up correctly.

**Action**: Skip the schema.sql step, you're done!

---

### Error: "Failed to upload credential document"

**Cause**: Storage bucket doesn't exist or isn't public

**Fix**:
1. Supabase Dashboard → **Storage**
2. If `make-93e10323-credentials` doesn't exist:
   - Click **New bucket**
   - Name: `make-93e10323-credentials`
   - Set to **Public**
   - File size limit: 10485760 (10MB)
3. If it exists but is private:
   - Click bucket → **Settings**
   - Toggle **Public bucket** to ON

---

### Error: "Database error while saving credential metadata"

**Cause**: Table doesn't exist or RLS policy blocking insert

**Fix**:
1. Verify tables exist:
   - Supabase Dashboard → **Table Editor**
   - Should see: `profiles`, `issued_credentials`

2. If tables missing, run `/supabase/schema-clean.sql` (idempotent version)

3. Check RLS policies:
   - Table Editor → `issued_credentials` → **Policies**
   - Should see policy: "Service role can insert credentials"

---

### Error: "Unauthorized - invalid or missing access token"

**Cause**: User not logged in or session expired

**Fix**:
1. Log out
2. Log back in
3. Try the action again

---

## Deployment Checklist

Use this to verify everything is set up:

- [ ] **Database tables exist**
  - Go to Supabase → Table Editor
  - Verify: `profiles`, `issued_credentials`

- [ ] **RLS policies enabled**
  - Click each table → Policies tab
  - Should see 3 policies on `profiles`
  - Should see 3 policies on `issued_credentials`

- [ ] **Edge function deployed**
  - Reload signup page
  - See yellow banner (not red)

- [ ] **Storage bucket exists**
  - Supabase → Storage
  - Bucket: `make-93e10323-credentials`
  - Set to: Public

- [ ] **Test signup**
  - Fill form with test data
  - Click Register
  - Should redirect to login

- [ ] **Test login**
  - Use credentials from signup
  - Click Sign In
  - Should see Dashboard

- [ ] **Test credential issuance**
  - Click "PAN Card" in catalog
  - Fill form
  - Click "Issue Credential"
  - Should see success, appear in "My Credentials"

---

## Quick Verification Script

Run this in Supabase SQL Editor to check your setup:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'issued_credentials');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'issued_credentials');

-- Count policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'issued_credentials');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'issued_credentials';
```

**Expected results**:
- 2 tables found
- Both have `rowsecurity = true`
- 6 policies total (3 per table)
- 3 indexes on `issued_credentials`

---

## Still Having Issues?

1. **Check browser console** (F12 → Console)
   - Look for error messages
   - Note the exact error text

2. **Check Supabase logs**
   - Dashboard → Edge Functions → Logs
   - Look for 500 errors or exceptions

3. **Verify environment**
   - Dashboard → Settings → API
   - Confirm `Project URL` and `anon` key exist

4. **Test health endpoint**
   - Open in browser: `https://zlzjfjjrhedelcgbhfla.supabase.co/functions/v1/make-server-93e10323/health`
   - Should return: `{"status":"ok"}`
   - If error: Edge function not deployed

5. **Redeploy everything**
   - Make settings → Deploy edge function
   - Wait 30 seconds
   - Hard refresh browser (Ctrl+Shift+R)
