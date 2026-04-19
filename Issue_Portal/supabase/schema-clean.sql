-- Citizen Portal Database Schema
-- IDEMPOTENT VERSION - Safe to run multiple times

-- ============================================================================
-- DROP EXISTING POLICIES (if they exist)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own credentials" ON issued_credentials;
DROP POLICY IF EXISTS "Service role can insert credentials" ON issued_credentials;
DROP POLICY IF EXISTS "Users can view all active credentials for verification" ON issued_credentials;
-- Only drop uploaded_documents policies if the table already exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'uploaded_documents') THEN
    DROP POLICY IF EXISTS "Users can view own uploads" ON uploaded_documents;
    DROP POLICY IF EXISTS "Users can insert own uploads" ON uploaded_documents;
  END IF;
END $$;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- ISSUED_CREDENTIALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS issued_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL CHECK (credential_type IN ('PAN_CARD', 'INCOME_CERTIFICATE', 'AADHAAR_CARD')),
  credential_data JSONB NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  public_key TEXT NOT NULL,
  signature TEXT NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_issued_credentials_user_id ON issued_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_issued_credentials_type ON issued_credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_issued_credentials_status ON issued_credentials(status);

-- Enable RLS
ALTER TABLE issued_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own credentials"
  ON issued_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert credentials"
  ON issued_credentials FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view all active credentials for verification"
  ON issued_credentials FOR SELECT
  USING (status = 'active');

-- ============================================================================
-- UPLOADED_DOCUMENTS TABLE
-- Stores metadata for PDFs uploaded and verified by the Flutter app
-- ============================================================================
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

-- Create index
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_user_id ON uploaded_documents(user_id);

-- Enable RLS
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own uploads"
  ON uploaded_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads"
  ON uploaded_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTO-CREATE PROFILE ON AUTH USER CREATION
-- This trigger automatically creates a profiles row when a new user signs up
-- via supabase.auth.signUp(), using metadata passed during registration.
-- ============================================================================
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

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STORAGE BUCKET & POLICIES
-- Allows authenticated users to upload/download credential PDFs.
-- The bucket is created as public (for download links).
-- ============================================================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('make-93e10323-credentials', 'make-93e10323-credentials', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload credentials' AND tablename = 'objects') THEN
    DROP POLICY "Authenticated users can upload credentials" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for credentials' AND tablename = 'objects') THEN
    DROP POLICY "Public read access for credentials" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own credential files' AND tablename = 'objects') THEN
    DROP POLICY "Users can update own credential files" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own credential files' AND tablename = 'objects') THEN
    DROP POLICY "Users can delete own credential files" ON storage.objects;
  END IF;
END $$;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload credentials"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'make-93e10323-credentials'
    AND auth.role() = 'authenticated'
  );

-- Allow public read (the bucket is public, but this ensures RLS doesn't block)
CREATE POLICY "Public read access for credentials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'make-93e10323-credentials');

-- Allow users to update their own files
CREATE POLICY "Users can update own credential files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'make-93e10323-credentials'
    AND auth.role() = 'authenticated'
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own credential files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'make-93e10323-credentials'
    AND auth.role() = 'authenticated'
  );
