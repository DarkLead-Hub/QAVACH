# QAVACH — Full Build Task Tracker

## Phase 0 — Infrastructure Setup
- [x] Create [.env](file:///home/snbhowmik/CODE/QAVACH/.env) at repo root
- [x] Create [docker-compose.yml](file:///home/snbhowmik/CODE/QAVACH/docker-compose.yml) (Redis + MinIO)
- [x] Run `docker compose up -d` (user needs to run with sudo)

## Phase 1 — GovSign API (Step 1)
- [x] Scaffold `services/govsign/` directory structure
- [x] Install liboqs system library + Python dependencies
- [x] Create `config.py` (env vars, constants)
- [x] Create `db/models.py` (Department, CbomEntry, PgcaSession)
- [x] Create `crypto/signer.py` (ML-DSA, SLH-DSA sign/verify + classical passthrough)
- [x] Create `crypto/keys.py` (key generation, storage)
- [x] Create `crypto/kem.py` (ML-KEM encapsulate/decapsulate)
- [x] Create `middleware/auth.py` (API key validation)
- [x] Create `db/cbom.py` (CBOM read/write)
- [x] Create `routers/sign.py` (POST /sign, POST /verify)
- [x] Create `routers/keys.py` (GET /pubkeys/{dept_id})
- [x] Create `routers/departments.py` (POST /departments, GET /departments)
- [x] Create `routers/sessions.py` (POST /sessions, POST /sessions/{id}/proof, GET /sessions/{id})
- [x] Create `routers/cbom.py` (GET /cbom)
- [x] Create `main.py` (FastAPI app)
- [x] Create `seeds/seed_departments.py`
- [x] Create `requirements.txt` + `Dockerfile`
- [x] Test GovSign health, sign, verify endpoints

## Phase 1 — Mock Issuer CA (Step 2)
- [x] Scaffold `services/mock-ca/` directory structure
- [x] Create `demo_citizens.py` (3 hardcoded citizens)
- [x] Create `models.py` (SignedCredential + attribute models)
- [x] Create `config.py`
- [x] Create `issuers/income_tax.py` (PQC — SLH-DSA)
- [x] Create `issuers/uidai.py` (PQC — ML-DSA-44)
- [x] Create `issuers/revenue.py` (Classical — RSA-2048)
- [x] Create `issuers/health.py` (Classical — RSA-2048)
- [x] Create `main.py` (FastAPI endpoints)
- [x] Create `requirements.txt`
- [x] Test credential issuance

## Phase 1 — PQC Sidecar (for Flutter)
- [x] Create `services/govsign/sidecar.py` (keygen, sign, KEM wrap/unwrap)
- [x] Test sidecar endpoints

## Phase 2 — CBOM Dashboard (Step 3)
- [x] Scaffold React + Vite + Tailwind project in `dashboard/`
- [x] Create TypeScript types (`api/types.ts`)
- [x] Create API layer (`api/govsign.ts`)
- [x] Build `SummaryCards.tsx`
- [x] Build `DeptTable.tsx` (inlined `RiskBar`, `StatusBadge`, `AlgoBadge`)
- [x] Build `CompliancePie.tsx`
- [x] Build `ActivityBar.tsx`
- [x] Build `ActivityFeed.tsx`
- [x] Build `Overview.tsx` page
- [x] Build `DeptDetail.tsx` page
- [x] Build `TopBar.tsx`
- [ ] Build `Sidebar.tsx` (missing in `dashboard/src/components/layout`)
- [ ] Build `StatusDot.tsx` and `RefreshIndicator.tsx` (missing in `dashboard/src/components/common`)
- [x] Add `.env` config
- [x] Test dashboard renders with GovSign data

## Phase 3 — QAVACH Flutter App (Step 4)
- [ ] Create Flutter project `qavach_app/`
- [ ] Add pubspec dependencies
- [ ] Create models (citizen, credential, pgca_session)
- [ ] Create services (auth, credential, crypto, opa, storage, govsign)
- [ ] Create providers (auth, credentials, session)
- [ ] Build onboarding screens:
  - [ ] `onboarding_landing_screen.dart`
  - [ ] `aadhaar_input_screen.dart`
  - [ ] `otp_screen.dart`
  - [ ] `keygen_screen.dart`
- [ ] Build `splash_screen.dart`
- [ ] Build `home_screen.dart`
- [ ] Build `scan_screen.dart`
- [ ] Build `policy_check_screen.dart`
- [ ] Build `proof_result_screen.dart`
- [ ] Build `credential_detail_screen.dart`
- [ ] Create OPA policy Dart implementations (in `opa_service.dart`)
- [ ] Test full onboarding + scan + verify flow

## Phase 4 — PQC Portals (Steps 5-7)
- [ ] Create shared portal components in `portals/shared/` (`PortalLayout.tsx`, `QrVerifier.tsx`, `SecurityBadge.tsx`)
- [ ] Build Scholarship Portal (`portals/scholarship/`) — port 3001
- [ ] Build Home Loan Portal (`portals/homeloan/`) — port 3002
- [ ] Build Land Mutation Portal (`portals/land-mutation/`) — port 3003
- [ ] Test QR generation + polling flow

## Phase 5 — Legacy Portals (Step 8)
- [ ] Build Ration Card Portal (`portals/ration-card/`) — port 3004 (missing)
- [ ] Build Trade Licence Portal (`portals/trade-licence/`) — port 3005 (missing)
- [ ] Test classical verification + warning banners
