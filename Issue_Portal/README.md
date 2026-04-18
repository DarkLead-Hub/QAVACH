# DigiLocker-Style Credential Issuing Portal

A secure, post-quantum cryptographic credential management system built with React, Supabase, and SLH-DSA (SPHINCS+) digital signatures.

## Features

- **Post-Quantum Cryptography**: All credentials are signed using SLH-DSA (SPHINCS+), a NIST-approved post-quantum signature scheme
- **Supabase Backend**: Full authentication, PostgreSQL database, and cloud storage
- **Realistic Credential PDFs**: Government-styled documents for PAN Card, Income Certificate, and Aadhaar Card
- **Public Verification**: Issued credentials can be verified by external applications via public URLs
- **Secure Authentication**: Email/password registration and login with protected routes

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS v4
- **Backend**: Supabase Edge Functions (Hono server)
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage buckets
- **Cryptography**: `@noble/post-quantum` (SLH-DSA-SHA2-128s)
- **PDF Generation**: Manual PDF construction with embedded signatures

## Setup Instructions

### 1. Database Setup

Run the following SQL in your **Supabase SQL Editor**:

```sql
-- Copy and paste the entire contents of supabase/schema.sql
```

This will create:
- `profiles` table (user information)
- `issued_credentials` table (credential metadata)
- Row-Level Security (RLS) policies
- Indexes for performance

### 2. Storage Bucket

The storage bucket `make-93e10323-credentials` is automatically created on server startup. If you need to create it manually:

1. Go to Supabase Dashboard → Storage
2. Create bucket: `make-93e10323-credentials`
3. Set to **Public** (for credential verification)
4. File size limit: 10MB

### 3. Deploy Edge Function

The server code is in `/supabase/functions/server/`. After making changes:

1. Go to **Make settings page**
2. Deploy the Supabase edge function
3. Wait for deployment confirmation

### 4. Environment Variables

No manual environment configuration needed - Supabase connection details are auto-configured via Make integration.

## Architecture

### Three-Tier Architecture

```
Frontend (React) → Server (Hono/Deno) → Database (PostgreSQL)
                        ↓
                  Storage (Supabase Storage)
```

### Credential Issuance Flow

1. User fills out credential form (e.g., PAN Card details)
2. Frontend sends request to `/credentials/issue` with access token
3. Server validates authentication
4. **SLH-DSA key pair generated** (post-quantum secure)
5. Credential payload signed with private key
6. **Realistic PDF generated** with embedded signature
7. PDF uploaded to Supabase Storage bucket
8. Metadata saved to database with public URL
9. Public URL returned to user

### SLH-DSA Signing Implementation

Located in `/supabase/functions/server/credential-generator.tsx`:

```typescript
// Generate post-quantum key pair
const privateKey = slh_dsa_sha2_128s.keygen();
const publicKey = slh_dsa_sha2_128s.getPublicKey(privateKey);

// Sign credential payload
const signature = slh_dsa_sha2_128s.sign(privateKey, payloadBytes);

// Store signature and public key (hex encoded)
```

Each credential PDF embeds:
- Full SLH-DSA signature (hex encoded)
- Public key for verification
- Timestamp
- Credential data

### PDF Generation

Three realistic document templates:

1. **PAN Card** (`generatePANCardPDF`)
   - Income Tax Department branding
   - Blue/white color scheme
   - PAN number, name, father's name, DOB
   - Embedded digital signature

2. **Income Certificate** (`generateIncomeCertificatePDF`)
   - Government of India letterhead
   - Formal certificate layout
   - Income details, purpose, issuing authority
   - Full signature block

3. **Aadhaar Card** (`generateAadhaarCardPDF`)
   - UIDAI branding
   - Red/white design
   - Aadhaar number, demographics
   - QR code placeholder
   - Embedded signature

## API Endpoints

All routes prefixed with `/make-server-93e10323`

### Authentication

- `POST /auth/signup`
  - Body: `{ email, password, full_name, phone, address }`
  - Returns: `{ success, user }`

### Credentials

- `POST /credentials/issue` (requires auth)
  - Headers: `Authorization: Bearer <access_token>`
  - Body: `{ credential_type, credential_data }`
  - Returns: `{ success, credential: { id, type, public_url, signature, public_key } }`

- `GET /credentials` (requires auth)
  - Headers: `Authorization: Bearer <access_token>`
  - Returns: `{ credentials: [...] }`

- `GET /credentials/:id/verify` (public)
  - Returns: `{ credential: { type, public_url, signature, public_key, status } }`

## Database Schema

### `profiles`
- `id` (UUID, references `auth.users`)
- `email`, `full_name`, `phone`, `address`
- `created_at`, `updated_at`

### `issued_credentials`
- `id` (UUID)
- `user_id` (UUID, references `profiles`)
- `credential_type` (PAN_CARD | INCOME_CERTIFICATE | AADHAAR_CARD)
- `credential_data` (JSONB - form submission)
- `storage_path` (text)
- `public_url` (text)
- `public_key` (text - hex encoded SLH-DSA public key)
- `signature` (text - hex encoded SLH-DSA signature)
- `issue_date`, `status`, `created_at`

## Security Considerations

⚠️ **Important**: This is a demonstration/educational project. Do NOT use for:
- Collecting real PII (Personally Identifiable Information)
- Production government credential systems
- Any system requiring legal compliance

### Security Features

✅ Post-quantum cryptographic signatures (SLH-DSA)  
✅ Row-Level Security (RLS) on database tables  
✅ JWT-based authentication with Supabase Auth  
✅ Service role key isolated to server-side only  
✅ Public bucket for credential verification  

### Not Implemented (for production)

❌ Email verification (auto-confirmed for demo)  
❌ Rate limiting on credential issuance  
❌ Audit logging  
❌ Credential revocation workflow  
❌ Key rotation  

## Available Credentials

### Currently Issuable
- ✅ PAN Card
- ✅ Income Certificate
- ✅ Aadhaar Card

### Coming Soon (UI Only)
- Driving License
- Passport
- Voter ID Card
- Birth Certificate
- Domicile Certificate

## UI Design

- **Theme**: Pure white background, sharp borders (4px radius max)
- **Typography**: System sans-serif, clean and minimal
- **Layout**: Government portal aesthetic - structured, professional
- **Forms**: Standard inputs with subtle borders
- **No decorative elements**: No gradients, shadows, or modern styling

## File Structure

```
/src
  /app
    App.tsx                    # Main app with auth state
    /components
      Login.tsx                # Login form
      Signup.tsx               # Registration form
      Dashboard.tsx            # Credential catalog & issued list
  /utils
    supabaseClient.ts          # Supabase client singleton

/supabase
  /functions/server
    index.tsx                  # Hono server with routes
    credential-generator.tsx   # PDF generation + SLH-DSA signing
    kv_store.tsx              # Auto-generated (DO NOT EDIT)
  schema.sql                   # Database schema + RLS policies

/utils/supabase
  info.tsx                     # Auto-generated (DO NOT EDIT)
```

## License

MIT License - Educational/Demo purposes only

## Disclaimer

This project is for educational demonstration of post-quantum cryptography and credential management concepts. It is NOT intended for production use, collecting real government credentials, or handling sensitive personal data.
