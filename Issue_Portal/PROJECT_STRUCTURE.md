# Project Structure

## Complete File Listing

### Frontend Components
```
/src/app/
├── App.tsx                          # Main app with auth state management
└── components/
    ├── Login.tsx                    # Email/password login form
    ├── Signup.tsx                   # User registration form
    └── Dashboard.tsx                # Credential catalog + issued credentials list
```

### Utilities
```
/src/utils/
└── supabaseClient.ts                # Supabase client singleton + API_BASE URL
```

### Backend/Server
```
/supabase/functions/server/
├── index.tsx                        # Hono server with all API routes
├── credential-generator.tsx         # SLH-DSA signing + PDF generation
└── kv_store.tsx                     # Auto-generated (DO NOT EDIT)
```

### Database
```
/supabase/
└── schema.sql                       # Complete database schema + RLS policies
```

### Configuration
```
/utils/supabase/
└── info.tsx                         # Auto-generated Supabase config (DO NOT EDIT)
```

### Documentation
```
/
├── README.md                        # Complete technical documentation
├── SETUP.md                         # Quick setup guide
├── .env.example                     # Environment variables template
└── PROJECT_STRUCTURE.md             # This file
```

---

## Component Breakdown

### 1. App.tsx (Main Application)
**Purpose**: Root component with authentication state management

**Key Features**:
- Checks for existing session on mount
- Routes between Login, Signup, and Dashboard views
- Manages access token and user ID state
- Handles logout

**State**:
- `authView`: 'login' | 'signup' | 'dashboard'
- `accessToken`: JWT token from Supabase Auth
- `userId`: Current user's Supabase UID

---

### 2. Login.tsx
**Purpose**: User authentication form

**Features**:
- Email/password sign-in
- Supabase Auth integration
- Error handling and loading states
- Switch to signup view

**Integration**: Uses `supabase.auth.signInWithPassword()`

---

### 3. Signup.tsx
**Purpose**: New user registration

**Features**:
- Collects: email, password, full name, phone, address
- Password confirmation validation
- Calls server `/auth/signup` endpoint
- Auto-confirms email (no verification required)

**Server Integration**: `POST ${API_BASE}/auth/signup`

---

### 4. Dashboard.tsx
**Purpose**: Main application dashboard

**Contains 4 Sub-Components**:

#### a) CredentialCatalog (main view)
- Displays 8 credential types as cards
- 3 available: PAN Card, Income Certificate, Aadhaar Card
- 5 disabled: "Coming Soon" status
- Clean white theme with sharp borders

#### b) IssuedCredentialsList
- Table view of user's credentials
- Shows: type, issue date, status, download link
- Empty state message

#### c) CredentialFormModal
- Dynamic form based on credential type
- Collects type-specific data
- Submits to `/credentials/issue`
- Shows loading and error states

#### d) FormField Helper
- Reusable input/textarea component
- Handles text, date, number inputs
- Required field indicators

**Navigation**: Tabs between "Issue Credentials" and "My Credentials"

---

### 5. supabaseClient.ts
**Purpose**: Centralized Supabase client

**Exports**:
- `supabase`: Singleton Supabase client instance
- `API_BASE`: Base URL for server API (`https://{projectId}.supabase.co/functions/v1/make-server-93e10323`)

**Used By**: All components that interact with auth or API

---

### 6. Server: index.tsx
**Purpose**: Hono web server with API routes

**Routes**:

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/health` | No | Health check |
| POST | `/auth/signup` | No | User registration |
| POST | `/credentials/issue` | Yes | Issue new credential |
| GET | `/credentials` | Yes | List user's credentials |
| GET | `/credentials/:id/verify` | No | Public verification |

**Startup Tasks**:
- Initialize storage bucket
- Enable CORS for all origins
- Set up logging

**Authentication**:
- Uses Bearer token from `Authorization` header
- Validates with `supabase.auth.getUser(accessToken)`
- Returns 401 for invalid/missing tokens

---

### 7. Server: credential-generator.tsx
**Purpose**: Core credential generation and signing logic

**Main Function**: `generateCredentialPDF(credentialType, credentialData, userId)`

**Process**:
1. Generate SLH-DSA key pair using `@noble/post-quantum`
2. Create credential payload (type, data, userId, timestamp, issuer)
3. Sign payload with private key
4. Convert signature and public key to hex
5. Generate PDF based on credential type
6. Return: { pdfBlob, publicKey, signature }

**PDF Templates**:

#### PAN Card PDF
- Size: 340x215 (card dimensions)
- Colors: Blue header, white background
- Fields: PAN number, name, father's name, DOB
- Signature block: 80 chars of signature shown

#### Income Certificate PDF
- Size: A4 (595x842)
- Layout: Formal government letterhead
- Fields: Name, parent name, address, income, category, purpose
- Full signature display in footer

#### Aadhaar Card PDF
- Size: 340x215 (card dimensions)
- Colors: Red/white UIDAI branding
- Fields: Aadhaar number, name, DOB, gender, address
- QR code placeholder
- Compact signature display

**Security**: Each PDF embeds full SLH-DSA signature + public key + timestamp

---

### 8. schema.sql
**Purpose**: Complete database setup

**Creates**:

#### Tables:
1. `profiles`
   - Links to `auth.users(id)`
   - Stores: email, full_name, phone, address
   - Has updated_at trigger

2. `issued_credentials`
   - Foreign key to `profiles(user_id)`
   - Stores: type, data (JSONB), storage path, public URL
   - Cryptographic fields: public_key, signature
   - Status: active | revoked | expired

#### Indexes:
- `idx_issued_credentials_user_id`
- `idx_issued_credentials_type`
- `idx_issued_credentials_status`

#### RLS Policies:
- Users can view/update own profile
- Users can view own credentials
- Public can verify active credentials
- Service role can insert credentials

#### Functions:
- `update_updated_at_column()`: Auto-updates timestamp

---

## Data Flow Diagrams

### User Registration Flow
```
User → Signup.tsx
  ↓ (form submit)
POST /auth/signup
  ↓
Server: admin.createUser() (Supabase Auth)
  ↓
Server: Insert into profiles table
  ↓
Return success
  ↓
Redirect to Login.tsx
```

### Login Flow
```
User → Login.tsx
  ↓ (form submit)
supabase.auth.signInWithPassword()
  ↓
Supabase Auth validates
  ↓
Returns: { session: { access_token }, user: { id } }
  ↓
App.tsx updates state
  ↓
Render Dashboard.tsx
```

### Credential Issuance Flow
```
User → Dashboard → CredentialFormModal
  ↓ (fill form)
POST /credentials/issue (with Bearer token)
  ↓
Server: Validate auth token
  ↓
Server: Import credential-generator.tsx
  ↓
Generate SLH-DSA key pair
  ↓
Create payload: { type, data, userId, timestamp, issuer }
  ↓
Sign with slh_dsa_sha2_128s.sign()
  ↓
Generate PDF with embedded signature
  ↓
Upload PDF to Storage: credentials/{userId}/{type}/{filename}
  ↓
Get public URL from Storage
  ↓
Insert into issued_credentials table
  ↓
Return: { id, type, public_url, signature, public_key }
  ↓
Dashboard refreshes → Shows in "My Credentials"
```

---

## Technology Deep Dive

### Post-Quantum Cryptography: SLH-DSA

**Library**: `@noble/post-quantum`  
**Scheme**: `slh_dsa_sha2_128s` (SPHINCS+-SHA2-128s)

**Why SLH-DSA?**
- NIST-approved post-quantum signature scheme
- Secure against quantum computer attacks
- Stateless (unlike XMSS)
- 128-bit security level

**Key Sizes**:
- Private key: 64 bytes
- Public key: 32 bytes
- Signature: ~7,856 bytes (large, but secure)

**Implementation**:
```typescript
const privateKey = slh_dsa_sha2_128s.keygen();
const publicKey = slh_dsa_sha2_128s.getPublicKey(privateKey);
const signature = slh_dsa_sha2_128s.sign(privateKey, message);
```

---

### PDF Generation

**Approach**: Manual PDF construction (not using jsPDF library)

**Why Manual?**
- Full control over layout
- Realistic government document styling
- Embedded signature data
- Lightweight (no heavy dependencies)

**Format**: PDF 1.4 specification
- Object stream structure
- Font embedding (Helvetica, Helvetica-Bold)
- Color support (RGB)
- Text positioning with BT/ET blocks

---

### Supabase Integration

**Three Services Used**:

1. **Auth**: User registration + JWT tokens
2. **Database**: PostgreSQL with RLS
3. **Storage**: Public bucket for PDFs

**Client Types**:
- Frontend: Anon key (limited permissions)
- Backend: Service role key (admin permissions)

**RLS Benefits**:
- Users can't access other users' data
- Public verification still works
- No manual auth checks in queries

---

## Environment Architecture

### Make Environment Specifics

**DO NOT**:
- Run `vite build` (will fail)
- Create `index.html` (auto-generated)
- Manually start dev server (already running)
- Access `localhost` URLs (use preview instead)

**DO**:
- Edit `src/app/App.tsx` (main entrypoint)
- Create components in `src/app/components/`
- Use `.tsx` files only (no `.jsx`, `.html`)
- Deploy server changes from Make settings

---

## API Reference

### Authentication

#### POST /auth/signup
```json
{
  "email": "user@example.com",
  "password": "secure123",
  "full_name": "John Doe",
  "phone": "9876543210",
  "address": "123 Street, City"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  }
}
```

### Credentials

#### POST /credentials/issue
**Headers**: `Authorization: Bearer {access_token}`

```json
{
  "credential_type": "PAN_CARD",
  "credential_data": {
    "full_name": "John Doe",
    "father_name": "Richard Doe",
    "dob": "1990-01-15",
    "pan_number": "ABCDE1234F"
  }
}
```

**Response**:
```json
{
  "success": true,
  "credential": {
    "id": "uuid-here",
    "type": "PAN_CARD",
    "public_url": "https://.../credentials/...",
    "issue_date": "2026-04-18T...",
    "public_key": "hex-encoded-key",
    "signature": "hex-encoded-signature"
  }
}
```

#### GET /credentials
**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "credentials": [
    {
      "id": "uuid",
      "credential_type": "PAN_CARD",
      "public_url": "https://...",
      "issue_date": "2026-04-18T...",
      "status": "active"
    }
  ]
}
```

#### GET /credentials/:id/verify
**No auth required**

**Response**:
```json
{
  "credential": {
    "id": "uuid",
    "credential_type": "PAN_CARD",
    "public_url": "https://...",
    "public_key": "hex-key",
    "signature": "hex-signature",
    "issue_date": "2026-04-18T...",
    "status": "active"
  }
}
```

---

## Dependencies

### Frontend
- `react` (18.3.1) - UI framework
- `@supabase/supabase-js` (2.103.3) - Supabase client
- `tailwindcss` (4.1.12) - Styling

### Backend (Deno)
- `hono` - Web server framework
- `@supabase/supabase-js` (via jsr) - Database/storage client

### Cryptography
- `@noble/post-quantum` (0.6.1) - SLH-DSA implementation

### Utilities
- `qrcode` (1.5.4) - Installed but not yet used (for Aadhaar QR)

---

## Security Checklist

✅ **Implemented**:
- Post-quantum signatures on all credentials
- JWT authentication with Supabase
- Row-Level Security on database
- Service role key never exposed to frontend
- Public bucket for verification
- CORS enabled for API access

⚠️ **Not Implemented** (demo limitations):
- Email verification (auto-confirmed)
- Rate limiting on credential issuance
- Credential revocation workflow
- Audit logging
- Key rotation
- Real signature verification UI

---

## Future Enhancements

### Phase 1: Complete Current Credentials
- [ ] Add QR code generation for Aadhaar Card
- [ ] Improve PDF styling with actual logos
- [ ] Add watermarks to PDFs

### Phase 2: Enable Remaining Credentials
- [ ] Driving License implementation
- [ ] Passport implementation
- [ ] Voter ID Card implementation
- [ ] Birth Certificate implementation
- [ ] Domicile Certificate implementation

### Phase 3: Advanced Features
- [ ] Signature verification UI (verify uploaded PDFs)
- [ ] Credential revocation system
- [ ] Audit trail for issuance
- [ ] Bulk issuance API
- [ ] Email notifications on issuance

### Phase 4: Production Hardening
- [ ] Rate limiting
- [ ] Email verification
- [ ] 2FA support
- [ ] CAPTCHA on signup
- [ ] Session management
- [ ] Key rotation policy
