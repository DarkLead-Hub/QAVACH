# Quick Setup Guide

## Step 1: Run Database Schema

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the entire contents of `/supabase/schema.sql`
5. Click **Run**

This will create:
- `profiles` table
- `issued_credentials` table
- All RLS policies
- Indexes

## Step 2: Deploy Server Function

The server will automatically:
- Create the storage bucket `make-93e10323-credentials`
- Set up all API routes
- Initialize SLH-DSA signing

**Important:** After making any server code changes, redeploy the edge function from the **Make settings page**.

## Step 3: Test the Application

1. Click **Sign up** to create a new account
2. Fill in your details (email auto-confirms, no verification needed)
3. Log in with your credentials
4. Browse the credential catalog
5. Issue a credential (PAN Card, Income Certificate, or Aadhaar Card)
6. View your issued credentials in "My Credentials" tab
7. Download the signed PDF

## How It Works

### Authentication Flow
```
User → Signup Form → Server /auth/signup → Creates Auth User + Profile → Auto-login
User → Login Form → Supabase Auth → Dashboard
```

### Credential Issuance Flow
```
User fills form → POST /credentials/issue (with access token)
    ↓
Server validates auth
    ↓
Generate SLH-DSA key pair
    ↓
Sign credential with SPHINCS+
    ↓
Generate realistic PDF with signature
    ↓
Upload to Supabase Storage
    ↓
Save metadata to database
    ↓
Return public URL to user
```

### Security Features

✅ **Post-Quantum Signatures**: Each credential is signed with SLH-DSA (SPHINCS+)  
✅ **Row-Level Security**: Users can only see their own credentials  
✅ **Public Verification**: Anyone can verify a credential via public URL  
✅ **Protected Routes**: Server validates JWT access tokens  

## Troubleshooting

### "Unauthorized" error when issuing credentials
- Make sure you're logged in
- The access token may have expired - try logging out and back in

### "Failed to upload credential document"
- Storage bucket may not be created
- Check Supabase Dashboard → Storage
- Bucket name should be: `make-93e10323-credentials`

### Database errors
- Ensure you ran the schema.sql file
- Check that tables exist: `profiles`, `issued_credentials`
- Verify RLS policies are enabled

### Server errors
- Redeploy the edge function from Make settings
- Check server logs in Supabase Dashboard → Edge Functions

## Next Steps

After basic setup works:

1. **Test all three credential types**
   - PAN Card
   - Income Certificate
   - Aadhaar Card

2. **Verify signatures**
   - Open a credential PDF
   - Note the embedded signature and public key
   - Use the verification endpoint: `/credentials/:id/verify`

3. **Explore the code**
   - Server: `/supabase/functions/server/`
   - PDF generation: `credential-generator.tsx`
   - Frontend: `/src/app/components/`

## Important Notes

⚠️ **This is a demo application**
- Do NOT use for real government credentials
- Do NOT collect real PII
- For educational purposes only

✅ **Safe for demos**
- Test data only
- Local development
- Learning post-quantum cryptography
