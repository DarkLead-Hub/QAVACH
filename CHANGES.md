# CHANGES.md — Issue Portal Fix + Flutter Integration + SLH-DSA Upload

**Date:** 2026-04-18  
**Author:** Antigravity (AI Coding Assistant)  

---

## Overview

Three workstreams were implemented on top of the existing QAVACH platform:

1. **Issue Portal Auth Fix** — Switched from edge-function-proxied signup to direct Supabase client-side auth
2. **Flutter ↔ Supabase Integration** — Connected the Flutter app to the same Supabase database used by the Issue Portal
3. **SLH-DSA PDF Upload & Verification** — New Flutter feature to upload PDFs with embedded SLH-DSA signatures, verify them via the PQC sidecar, and store in Supabase

---

## Workstream 1 — Issue Portal Auth Fix

### Problem
Signup was failing with 401 because it called a Supabase Edge Function (`make-server-93e10323/auth/signup`) that required deployment via "Make settings". The edge function used `admin.createUser` which needs the service role key.

### Solution
Switched to **client-side `supabase.auth.signUp()`** which works without any edge function. Profile rows are now auto-created by a Postgres trigger (`handle_new_user()`).

### Files Modified

| File | Change |
|:-----|:-------|
| `Issue_Portal/src/app/components/Signup.tsx` | Replaced edge function call with `supabase.auth.signUp()`. Removed server health check. Added success message display. |
| `Issue_Portal/src/app/components/Login.tsx` | Added profile upsert after login (handles pre-trigger users). |
| `Issue_Portal/src/app/components/Dashboard.tsx` | Switched credential fetch from edge function to direct `supabase.from('issued_credentials').select()`. |
| `Issue_Portal/supabase/schema-clean.sql` | Added `handle_new_user()` trigger, `uploaded_documents` table, and associated RLS policies. |

### Database Changes

New trigger on `auth.users`:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, address)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

New table `uploaded_documents`:
```sql
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  signature_verified BOOLEAN DEFAULT false,
  verification_algorithm TEXT,
  public_key TEXT,
  signature TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Workstream 2 — Flutter ↔ Supabase Integration

### What Changed

The Flutter app now connects to the same Supabase project (`zlzjfjjrhedelcgbhfla`) used by the Issue Portal. Users created in the Issue Portal can log in on the Flutter app and access their issued credential PDFs.

### Files Modified

| File | Change |
|:-----|:-------|
| `qavach_app/pubspec.yaml` | Added `supabase_flutter`, `file_picker`, `open_filex`, `path_provider` |
| `qavach_app/lib/config.dart` | Added Supabase URL, anon key, bucket name, edge function base URL |
| `qavach_app/lib/main.dart` | Added `Supabase.initialize()` and 4 new routes |
| `qavach_app/lib/providers/providers.dart` | Added Supabase service providers |
| `qavach_app/lib/screens/home/home_screen.dart` | Added DigiLocker button in app bar |

### Files Added

| File | Purpose |
|:-----|:--------|
| `qavach_app/lib/services/supabase_auth_service.dart` | Sign in/up/out via Supabase Auth |
| `qavach_app/lib/services/supabase_credential_service.dart` | Fetch/download/upload credentials from Supabase |
| `qavach_app/lib/screens/supabase_auth/supabase_login_screen.dart` | Login UI |
| `qavach_app/lib/screens/supabase_auth/supabase_signup_screen.dart` | Signup UI |
| `qavach_app/lib/screens/supabase_auth/supabase_home_screen.dart` | Credential dashboard with tabs |

### New Routes

| Route | Screen | Purpose |
|:------|:-------|:--------|
| `/supabase-login` | SupabaseLoginScreen | Email/password login |
| `/supabase-signup` | SupabaseSignupScreen | Account registration |
| `/supabase-home` | SupabaseHomeScreen | Issued + uploaded credentials |
| `/pdf-verify-upload` | PdfVerifyUploadScreen | Upload & verify PDFs |

---

## Workstream 3 — SLH-DSA PDF Upload & Verification

### What Changed

Users can now:
1. Pick a PDF file from their device
2. The app extracts embedded SLH-DSA signature data (public key hex, signature hex) from the PDF
3. Sends the data to the PQC sidecar (`/sidecar/verify`) for **real SPHINCS+ verification**
4. If valid, uploads the PDF to Supabase Storage at `uploads/{user_id}/{filename}`
5. Saves metadata (including verification status) to the `uploaded_documents` table

### Files Modified

| File | Change |
|:-----|:-------|
| `qavach_app/lib/services/crypto_service.dart` | Added `verifySLHDSA()` method |

### Files Added

| File | Purpose |
|:-----|:--------|
| `qavach_app/lib/screens/supabase_auth/pdf_verify_upload_screen.dart` | Full upload/verify UI |

### Architecture Decision
The SLH-DSA verification is **real** (not mocked) — it goes through the PQC sidecar which uses liboqs. The sidecar's `/sidecar/verify` endpoint already supports SLH-DSA-SHAKE-128s via the `crypto/signer.py` module.

---

## Deviations from Existing Documentation

### vs TASK.md
- Phase 3 (Flutter App) items remain partially incomplete per the original tracker — this work **adds** the Supabase integration as a parallel feature, not a replacement for the mock-CA flow.

### vs DEPLOYMENT.md
- No changes to the deployment flow. The Issue Portal no longer requires edge function deployment for signup — it's fully client-side.

### vs SECURITY.md
- The SLH-DSA PDF verification feature aligns with the security architecture's use of FIPS 205 for archival signing.
- The `uploaded_documents` table has RLS policies ensuring users can only view/insert their own documents.

### vs README.md
- The Issue Portal is a new component not mentioned in the original README. Consider adding it to the repository structure section.

---

## Setup Instructions

### 1. Run Updated Schema
Run `Issue_Portal/supabase/schema-clean.sql` in the Supabase SQL Editor to create:
- The `handle_new_user()` trigger
- The `uploaded_documents` table
- Updated RLS policies

### 2. Flutter Dependencies
```bash
cd qavach_app
flutter pub get
```

### 3. Verify PQC Sidecar
Ensure the sidecar is running for SLH-DSA verification:
```bash
cd services/govsign
uvicorn sidecar:app --reload --port 8002
```
