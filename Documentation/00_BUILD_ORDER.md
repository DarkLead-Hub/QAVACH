# QAVACH — Build Order & System Overview

## What This System Is

QAVACH is a post-quantum cryptography (PQC) identity and document verification platform for Indian e-governance. It demonstrates how government services can issue, store, and verify citizen credentials using NIST-standardized PQC algorithms — without the original document ever leaving the citizen's device.

The system has three layers:

1. **GovSign API** — a microservice that government departments call to sign documents with PQC algorithms. It maintains a CBOM (Cryptography Bill of Materials) registry tracking which departments are PQC-compliant and which are still on classical crypto.

2. **QAVACH Flutter App** — the citizen-facing mobile wallet. Downloads documents from DigiLocker (mocked), stores them encrypted with ML-KEM-768 + AES-256-GCM, and when a verifier portal requests a claim, runs an OPA (Open Policy Agent) policy on-device to decide whether to generate a signed proof.

3. **Verifier Portals** — five web portals that consume QAVACH proofs. Three are PQC-enabled (scholarship, home loan, land mutation). Two are deliberately classical/legacy (ration card, trade licence) to demonstrate the migration gap and show CBOM warnings.

---

## Core Cryptographic Primitives

| Algorithm | NIST Standard | Role in System | Signature Size |
|---|---|---|---|
| ML-DSA-44 (Dilithium2) | FIPS 204 | Fast interactive PGCA proofs, live verification | 2,420 bytes |
| ML-DSA-65 (Dilithium3) | FIPS 204 | Department signing (medium security) | 3,309 bytes |
| SLH-DSA-SHAKE-128s | FIPS 205 | Long-term document archival signatures | 7,856 bytes |
| ML-KEM-768 (Kyber768) | FIPS 203 | Key encapsulation for document encryption | N/A (KEM) |
| AES-256-GCM | — | Symmetric encryption of documents in cloud | N/A |

**Critical distinction:**
- ML-KEM is a Key Encapsulation Mechanism. It produces a (ciphertext, sharedSecret) pair. The sharedSecret is used as the AES-256-GCM key. ML-KEM never encrypts data directly.
- QR codes carry ONLY: `{session_id, nonce, claim_type, callback_url}` (~120 bytes). The signature (2.4KB+) travels over HTTPS POST, never inside a QR.

---

## Build Order (Strict — Each Step Has Dependencies)

```
PHASE 1 — Backend Infrastructure
  Step 1 → 01_GOVSIGN_API.md          (FastAPI + liboqs-python)
  Step 2 → 02_MOCK_ISSUER_CA.md       (Mock government CA, issues PQC certs)

PHASE 2 — Compliance Dashboard  
  Step 3 → 03_CBOM_DASHBOARD.md       (React + reads GovSign /cbom endpoint)

PHASE 3 — Mobile App
  Step 4 → 04_QAVACH_FLUTTER.md       (Flutter + OPA WASM + FFI to liboqs)

PHASE 4 — PQC Portals (each is independent after Step 1 is running)
  Step 5 → 05_PORTAL_SCHOLARSHIP.md   (Next.js — income < 3L claim)
  Step 6 → 06_PORTAL_HOMELOAN.md      (Next.js — income + CIBIL composite claim)
  Step 7 → 07_PORTAL_LAND_MUTATION.md (Next.js — property ownership claim)

PHASE 5 — Legacy Portals (show the problem, no PQC)
  Step 8 → 08_LEGACY_PORTALS.md       (Ration card + Trade licence — RSA/ECDSA)
```

You can work on Steps 5–8 in parallel once Step 1 is running. Steps 5–8 are independent of each other.

---

## Shared Environment Variables

Create a `.env` file at the repo root. All services read from this.

```env
# GovSign API
GOVSIGN_HOST=http://localhost:8000
GOVSIGN_ADMIN_KEY=dev-admin-key-change-in-prod

# Mock Issuer CA
MOCK_CA_HOST=http://localhost:8001

# Session store (Redis)
REDIS_URL=redis://localhost:6379

# Cloud document store (Supabase or local MinIO for dev)
STORAGE_URL=http://localhost:9000
STORAGE_KEY=minioadmin
STORAGE_SECRET=minioadmin
STORAGE_BUCKET=qavach-docs

# Flutter app (these go in lib/config.dart)
FLUTTER_GOVSIGN_URL=http://10.0.2.2:8000
FLUTTER_MOCK_CA_URL=http://10.0.2.2:8001

# Portal shared secret (portals register with GovSign using this)
PORTAL_REGISTRATION_SECRET=portal-secret-change-in-prod
```

---

## Repository Structure

```
qavach/
├── 00_BUILD_ORDER.md           ← you are here
├── 01_GOVSIGN_API.md
├── 02_MOCK_ISSUER_CA.md
├── 03_CBOM_DASHBOARD.md
├── 04_QAVACH_FLUTTER.md
├── 05_PORTAL_SCHOLARSHIP.md
├── 06_PORTAL_HOMELOAN.md
├── 07_PORTAL_LAND_MUTATION.md
├── 08_LEGACY_PORTALS.md
│
├── services/
│   ├── govsign/                ← Step 1 output
│   ├── mock-ca/                ← Step 2 output
│   └── redis/                  ← docker-compose spins this up
│
├── dashboard/                  ← Step 3 output (React)
│
├── qavach_app/                 ← Step 4 output (Flutter)
│
└── portals/
    ├── scholarship/            ← Step 5
    ├── homeloan/               ← Step 6
    ├── land-mutation/          ← Step 7
    ├── ration-card/            ← Step 8
    └── trade-licence/          ← Step 8
```

---

## Docker Compose (Infrastructure Only)

Create `docker-compose.yml` at repo root before starting any step:

```yaml
version: '3.9'
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  minio_data:
```

Run `docker-compose up -d` before starting development.

---

## Key Concepts Explained (Read Before Building Anything)

### Policy-Gated Credential Attestation (PGCA)
The core innovation. Rather than the verifier checking a credential, the CITIZEN'S DEVICE decides what can be proven. Only when an OPA (Open Policy Agent) Rego policy passes on-device does the app generate a signed proof. The signature is proof of policy compliance. The original document never leaves the device.

### CBOM (Cryptography Bill of Materials)
Every document signed through GovSign creates a CBOM log entry: `{dept_id, algorithm, doc_type, timestamp, quantum_safe: bool}`. The dashboard reads this log and shows each department's migration status. This answers the auditor question: "which parts of your system are still vulnerable?"

### The QR Size Problem (Solved)
SLH-DSA signatures are 7,856 bytes. ML-DSA-44 signatures are 2,420 bytes. Neither fits in a QR code. **Solution:** The QR contains only `{session_id: uuid, nonce: 32-byte-hex, claim_type: string, callback: url}` — roughly 120 bytes. The QAVACH app reads the QR, generates the proof, and POSTs it to the `callback` URL via HTTPS. The portal polls its own backend for the result.

### Hybrid Cryptography for Storage
ML-KEM-768 is a KEM — it encapsulates a random symmetric key. The flow:
1. `(ciphertext, sharedSecret) = ML-KEM-768.Encapsulate(userPublicKey)`
2. `encryptedDoc = AES-256-GCM.Encrypt(key=sharedSecret, data=document)`
3. Store `{ciphertext, encryptedDoc}` in cloud
4. To decrypt: `sharedSecret = ML-KEM-768.Decapsulate(userPrivateKey, ciphertext)`
5. `document = AES-256-GCM.Decrypt(key=sharedSecret, data=encryptedDoc)`

The private key NEVER leaves the device's secure storage.

---

## Demo Script (For Hackathon Judges)

**PQC Path (Scholarship portal):**
1. Open QAVACH app → "I am Priya Sharma, income ₹2.1L/year"
2. Open Scholarship portal on laptop → shows QR
3. Scan QR with QAVACH
4. App shows: "Policy check: income < ₹3,00,000 — PASS"
5. App shows: "Generating ML-DSA-44 proof..."
6. Portal shows: "Verified — Eligible. Signed with ML-DSA-44 (FIPS 204)"
7. Point to CBOM dashboard — ITD shown as "PQC Ready" in green

**Classical Path (Ration Card portal):**
1. Open Ration Card portal on laptop → shows QR
2. Scan QR with QAVACH
3. Portal shows yellow warning banner: "This portal uses RSA-2048 — not quantum-safe"
4. Point to CBOM dashboard — Revenue Dept shown as "Classical — High Risk" in red

**The contrast is the demo. Say: "Same app, same citizen, same document — two completely different levels of security depending on whether the department has migrated."**
