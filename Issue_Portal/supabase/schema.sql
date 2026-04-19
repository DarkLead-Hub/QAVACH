-- Citizen Portal Database Schema
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- PROFILES TABLE
-- Stores user profile information linked to Supabase Auth
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

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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
-- Stores metadata for all issued credentials
-- ============================================================================
CREATE TABLE IF NOT EXISTS issued_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL CHECK (credential_type IN ('PAN_CARD', 'INCOME_CERTIFICATE', 'AADHAAR_CARD')),
  credential_data JSONB NOT NULL, -- Stores form data submitted by user
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  public_url TEXT, -- Public access URL
  public_key TEXT NOT NULL, -- SLH-DSA public key (hex encoded)
  signature TEXT NOT NULL, -- SLH-DSA signature (hex encoded)
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_issued_credentials_user_id ON issued_credentials(user_id);
CREATE INDEX idx_issued_credentials_type ON issued_credentials(credential_type);
CREATE INDEX idx_issued_credentials_status ON issued_credentials(status);

-- RLS Policies for issued_credentials
ALTER TABLE issued_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credentials"
  ON issued_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert credentials"
  ON issued_credentials FOR INSERT
  WITH CHECK (true); -- Server will handle auth

CREATE POLICY "Users can view all active credentials for verification"
  ON issued_credentials FOR SELECT
  USING (status = 'active'); -- Allow public verification

-- ============================================================================
-- STORAGE BUCKET SETUP
-- Note: This must be created via Supabase Dashboard or server code
-- Bucket name: make-93e10323-credentials
-- ============================================================================
-- Run this after creating the bucket:
--
-- Storage policies (to be applied via Dashboard):
-- 1. Allow authenticated users to upload to their own folder
-- 2. Allow public read access for credential verification
--
-- Or use server-side bucket creation with proper policies

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

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
