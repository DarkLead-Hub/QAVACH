# GovSign API — Complete Build Specification

## What This Is

GovSign is a REST microservice that government departments integrate to sign documents using NIST-standardized post-quantum cryptography. It is the cryptographic backbone of the entire QAVACH system. Every document that enters the QAVACH ecosystem must be signed by a registered department through GovSign.

It does four things:
1. **Signs** document hashes using ML-DSA-65 (fast) or SLH-DSA-SHAKE-128s (archival)
2. **Verifies** PGCA proofs that QAVACH app submits during citizen verification flows
3. **Manages** department key pairs — generates, rotates, and publishes public keys
4. **Logs** every cryptographic operation to the CBOM (Cryptography Bill of Materials) registry

**Build this first. Every other component depends on it.**

---

## Tech Stack

- **Runtime:** Python 3.11+
- **Framework:** FastAPI 0.111+
- **PQC Library:** `liboqs-python` 0.10.x (Python bindings for liboqs)
- **Key Storage:** Local filesystem for dev, environment variable-injected for prod
- **Session Cache:** Redis 7 (for PGCA challenge-response sessions)
- **CBOM Store:** SQLite for dev (file: `govsign.db`), easily swappable to PostgreSQL
- **ASGI Server:** Uvicorn

---

## Prerequisites

Install liboqs system library BEFORE installing the Python package:

```bash
# Ubuntu/Debian
sudo apt-get install -y cmake ninja-build libssl-dev python3-dev
git clone --depth 1 https://github.com/open-quantum-safe/liboqs.git
cd liboqs && mkdir build && cd build
cmake -GNinja .. -DBUILD_SHARED_LIBS=ON
ninja && sudo ninja install
sudo ldconfig

# Then install Python bindings
pip install liboqs-python fastapi uvicorn[standard] redis sqlalchemy aiofiles python-dotenv pydantic
```

---

## Project Structure

```
services/govsign/
├── main.py                  ← FastAPI app, route registration
├── config.py                ← Env vars, constants
├── crypto/
│   ├── __init__.py
│   ├── signer.py            ← ML-DSA and SLH-DSA sign/verify wrappers
│   ├── kem.py               ← ML-KEM encapsulate/decapsulate (for future use)
│   └── keys.py              ← Key generation, storage, retrieval
├── db/
│   ├── __init__.py
│   ├── models.py            ← SQLAlchemy models (Department, CbomEntry, Session)
│   └── cbom.py              ← CBOM read/write operations
├── routers/
│   ├── __init__.py
│   ├── sign.py              ← POST /sign, POST /verify
│   ├── keys.py              ← GET /pubkeys/{dept_id}
│   ├── departments.py       ← POST /departments (register), GET /departments
│   ├── sessions.py          ← POST /sessions (PGCA challenge), GET /sessions/{id}
│   └── cbom.py              ← GET /cbom
├── middleware/
│   └── auth.py              ← API key validation middleware
├── seeds/
│   └── seed_departments.py  ← Seeds demo departments with correct algorithms
├── requirements.txt
└── Dockerfile
```

---

## Data Models

### Department (stored in SQLite)

```python
# db/models.py
from sqlalchemy import Column, String, Boolean, DateTime, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
import enum, datetime

Base = declarative_base()

class AlgorithmType(enum.Enum):
    ML_DSA_44 = "ML-DSA-44"
    ML_DSA_65 = "ML-DSA-65"
    SLH_DSA_128S = "SLH-DSA-SHAKE-128s"
    RSA_2048 = "RSA-2048"
    ECDSA_P256 = "ECDSA-P256"
    ECDSA_P384 = "ECDSA-P384"

class QuantumStatus(enum.Enum):
    PQC = "pqc"
    HYBRID = "hybrid"
    CLASSICAL = "classical"
    PENDING = "pending"

class Department(Base):
    __tablename__ = "departments"
    dept_id = Column(String, primary_key=True)   # e.g. "ITD", "UIDAI"
    name = Column(String, nullable=False)
    algorithm = Column(String, nullable=False)   # AlgorithmType value
    usage_description = Column(String)
    quantum_status = Column(String, default=QuantumStatus.PENDING.value)
    api_key = Column(String, nullable=False)     # hashed
    public_key_b64 = Column(Text)               # base64-encoded public key
    private_key_path = Column(String)           # path to encrypted private key file
    registered_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)

class CbomEntry(Base):
    __tablename__ = "cbom_entries"
    id = Column(String, primary_key=True)       # uuid
    dept_id = Column(String, nullable=False)
    algorithm = Column(String, nullable=False)
    doc_type = Column(String)                   # e.g. "income_certificate"
    operation = Column(String)                  # "sign" or "verify"
    quantum_safe = Column(Boolean)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class PgcaSession(Base):
    __tablename__ = "pgca_sessions"
    session_id = Column(String, primary_key=True)  # uuid
    nonce = Column(String, nullable=False)          # 32-byte hex
    claim_type = Column(String, nullable=False)     # e.g. "income_lt_3L"
    portal_id = Column(String, nullable=False)
    status = Column(String, default="pending")      # pending | verified | denied | expired
    proof_payload = Column(Text)                    # JSON, populated after verification
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime)
```

---

## Cryptographic Operations

### signer.py — complete implementation

```python
# crypto/signer.py
import oqs
import base64
import hashlib
from typing import Tuple

# Algorithm name constants — use these everywhere, never hardcode strings
ML_DSA_44 = "ML-DSA-44"     # FIPS 204 — fast interactive proofs
ML_DSA_65 = "ML-DSA-65"     # FIPS 204 — department credential signing
SLH_DSA   = "SPHINCS+-SHAKE-128s"  # liboqs name for SLH-DSA-SHAKE-128s (FIPS 205)
# NOTE: liboqs uses "SPHINCS+-SHAKE-128s" internally. Map to "SLH-DSA-SHAKE-128s" in all 
# API responses for NIST naming compliance.

LIBOQS_TO_NIST = {
    "ML-DSA-44": "ML-DSA-44",
    "ML-DSA-65": "ML-DSA-65",
    "SPHINCS+-SHAKE-128s": "SLH-DSA-SHAKE-128s",
    "SPHINCS+-SHAKE-128f": "SLH-DSA-SHAKE-128f",
}

def generate_keypair(algorithm: str) -> Tuple[bytes, bytes]:
    """Returns (public_key_bytes, private_key_bytes)"""
    with oqs.Signature(algorithm) as signer:
        public_key = signer.generate_keypair()
        private_key = signer.export_secret_key()
    return public_key, private_key

def sign_payload(algorithm: str, private_key_bytes: bytes, payload: bytes) -> bytes:
    """Signs arbitrary bytes. Returns raw signature bytes."""
    with oqs.Signature(algorithm) as signer:
        signer.set_secret_key(private_key_bytes)
        # Always hash the payload first — consistent with NIST guidance
        digest = hashlib.sha3_256(payload).digest()
        signature = signer.sign(digest)
    return signature

def verify_signature(algorithm: str, public_key_bytes: bytes, payload: bytes, signature: bytes) -> bool:
    """Returns True if signature is valid for payload under public_key."""
    try:
        with oqs.Signature(algorithm) as verifier:
            digest = hashlib.sha3_256(payload).digest()
            return verifier.verify(digest, signature, public_key_bytes)
    except Exception:
        return False

def sign_document_hash(algorithm: str, private_key_bytes: bytes, doc_hash_hex: str, dept_id: str, doc_type: str) -> dict:
    """
    High-level signing. Takes a document hash (hex), returns a structured signature envelope.
    This envelope is what gets embedded in PDFs / returned to departments.
    """
    import json, uuid
    from datetime import datetime, timezone

    envelope_data = {
        "doc_hash": doc_hash_hex,
        "dept_id": dept_id,
        "doc_type": doc_type,
        "algorithm": LIBOQS_TO_NIST.get(algorithm, algorithm),
        "signed_at": datetime.now(timezone.utc).isoformat(),
        "sig_id": str(uuid.uuid4()),
    }
    payload_bytes = json.dumps(envelope_data, sort_keys=True).encode()
    signature_bytes = sign_payload(algorithm, private_key_bytes, payload_bytes)
    
    return {
        **envelope_data,
        "signature_b64": base64.b64encode(signature_bytes).decode(),
    }
```

### keys.py — key storage

```python
# crypto/keys.py
import os, base64
from pathlib import Path
from .signer import generate_keypair

KEYS_DIR = Path("./keys")
KEYS_DIR.mkdir(exist_ok=True)

def store_keypair(dept_id: str, algorithm: str) -> tuple[str, str]:
    """Generates and stores a keypair. Returns (pub_key_b64, priv_key_path)."""
    pub_key, priv_key = generate_keypair(algorithm)
    priv_path = KEYS_DIR / f"{dept_id}.priv"
    priv_path.write_bytes(priv_key)
    priv_path.chmod(0o600)
    pub_key_b64 = base64.b64encode(pub_key).decode()
    return pub_key_b64, str(priv_path)

def load_private_key(priv_key_path: str) -> bytes:
    return Path(priv_key_path).read_bytes()

def load_public_key_bytes(pub_key_b64: str) -> bytes:
    return base64.b64decode(pub_key_b64)
```

---

## API Endpoints — Complete Specification

### Authentication
Every request (except `GET /pubkeys/{dept_id}` and `GET /health`) requires:
```
X-API-Key: <department_api_key>
```
Admin-only endpoints require the `GOVSIGN_ADMIN_KEY` env var value.

---

### POST /sign
Department submits a document hash to be signed.

**Request:**
```json
{
  "doc_hash": "sha3-256 hex string of document bytes",
  "doc_type": "income_certificate",
  "algorithm": "SLH-DSA-SHAKE-128s"
}
```

**Response 200:**
```json
{
  "sig_id": "uuid",
  "dept_id": "ITD",
  "doc_hash": "abc123...",
  "doc_type": "income_certificate",
  "algorithm": "SLH-DSA-SHAKE-128s",
  "signed_at": "2024-01-15T10:30:00Z",
  "signature_b64": "base64-encoded-signature",
  "quantum_safe": true,
  "cbom_entry_id": "uuid"
}
```

**Implementation notes:**
- Look up department by API key. If algorithm in request differs from dept's registered algorithm, return 400.
- Write a CbomEntry immediately after signing.
- If algorithm is RSA or ECDSA (classical), set `quantum_safe: false` in CBOM entry.

---

### POST /verify
Verifies a signature envelope. Used by portals.

**Request:**
```json
{
  "doc_hash": "sha3-256 hex string",
  "dept_id": "ITD",
  "signature_b64": "base64-encoded-signature",
  "signed_at": "2024-01-15T10:30:00Z",
  "sig_id": "uuid"
}
```

**Response 200:**
```json
{
  "valid": true,
  "dept_id": "ITD",
  "algorithm": "SLH-DSA-SHAKE-128s",
  "quantum_safe": true,
  "dept_name": "Income Tax Department"
}
```

---

### POST /sessions (PGCA Challenge Create)
Portal creates a session before displaying a QR code.

**Request:** (portal's API key in header)
```json
{
  "claim_type": "income_lt_3L",
  "portal_id": "scholarship-portal",
  "ttl_seconds": 300
}
```

**Response 200:**
```json
{
  "session_id": "uuid",
  "nonce": "32-byte-hex-string",
  "claim_type": "income_lt_3L",
  "callback_url": "http://govsign:8000/sessions/{session_id}/proof",
  "qr_payload": {
    "s": "session_id",
    "n": "nonce",
    "c": "income_lt_3L",
    "cb": "http://govsign:8000/sessions/{session_id}/proof"
  },
  "expires_at": "ISO8601"
}
```

The `qr_payload` field is exactly what gets encoded into the QR code. It is compact by design — abbreviate all keys to 1-2 chars to stay under 150 bytes.

---

### POST /sessions/{session_id}/proof (PGCA Proof Submit)
QAVACH app POSTs the signed proof here after OPA evaluation passes.

**Request:** (no API key — this endpoint is called by citizen devices)
```json
{
  "session_id": "uuid",
  "nonce": "must match session nonce",
  "claim_type": "income_lt_3L",
  "claim_value": true,
  "citizen_id_hash": "sha256 of Aadhaar number (never the number itself)",
  "issuer_dept_id": "ITD",
  "doc_sig_id": "uuid of the original document signature",
  "proof_signature_b64": "ML-DSA-44 signature over {nonce+claim_type+claim_value+citizen_id_hash}",
  "citizen_pub_key_b64": "citizen's ML-DSA-44 public key"
}
```

**Server-side verification steps:**
1. Check session exists and is "pending"
2. Check nonce matches
3. Check session not expired
4. Look up original doc signature by `doc_sig_id` — verify it exists and is valid
5. Verify `proof_signature_b64` using `citizen_pub_key_b64`
6. Update session status to "verified" or "denied"
7. Write CBOM entry for the verification operation

**Response 200:**
```json
{
  "session_id": "uuid",
  "status": "verified",
  "claim_type": "income_lt_3L",
  "claim_value": true,
  "verified_at": "ISO8601",
  "issuer": "Income Tax Department",
  "algorithm": "ML-DSA-44",
  "quantum_safe": true
}
```

---

### GET /sessions/{session_id}
Portal polls this endpoint after displaying QR to check if citizen has scanned and submitted proof.

**Response 200:**
```json
{
  "session_id": "uuid",
  "status": "pending | verified | denied | expired",
  "claim_type": "income_lt_3L",
  "result": null | { "claim_value": true, "verified_at": "ISO8601", "algorithm": "ML-DSA-44" }
}
```

Portals should poll every 2 seconds with a 5-minute timeout.

---

### GET /pubkeys/{dept_id}
Public endpoint — no API key required. Returns the department's current public key for independent verification.

**Response 200:**
```json
{
  "dept_id": "ITD",
  "name": "Income Tax Department",
  "algorithm": "SLH-DSA-SHAKE-128s",
  "public_key_b64": "base64...",
  "quantum_safe": true,
  "registered_at": "ISO8601"
}
```

---

### GET /cbom
Returns CBOM data for the dashboard. Admin key required.

**Query params:** `?status=pqc|hybrid|classical|pending` (optional filter)

**Response 200:**
```json
{
  "summary": {
    "total": 12,
    "pqc": 3,
    "hybrid": 2,
    "classical": 5,
    "pending": 2
  },
  "departments": [
    {
      "dept_id": "ITD",
      "name": "Income Tax Department",
      "algorithm": "SLH-DSA-SHAKE-128s",
      "usage": "Credential signing, document encryption",
      "quantum_status": "pqc",
      "quantum_risk": "low",
      "sign_count_30d": 142,
      "last_sign_at": "ISO8601"
    }
  ],
  "recent_entries": [
    {
      "dept_id": "ITD",
      "algorithm": "SLH-DSA-SHAKE-128s",
      "doc_type": "income_certificate",
      "operation": "sign",
      "quantum_safe": true,
      "timestamp": "ISO8601"
    }
  ]
}
```

---

### POST /departments (Admin)
Register a new department. Admin key required.

**Request:**
```json
{
  "dept_id": "CBSE",
  "name": "Central Board of Secondary Education",
  "algorithm": "ML-DSA-65",
  "usage_description": "Marksheet and certificate signing",
  "quantum_status": "pqc"
}
```

**Response 201:**
```json
{
  "dept_id": "CBSE",
  "api_key": "govsign-cbse-xxxxxxxx",
  "public_key_b64": "base64...",
  "algorithm": "ML-DSA-65",
  "message": "Department registered. Store the api_key — it will not be shown again."
}
```

---

## Seed Data

```python
# seeds/seed_departments.py
# Run: python seeds/seed_departments.py

SEED_DEPARTMENTS = [
    # PQC departments
    {"dept_id": "ITD", "name": "Income Tax Department", "algorithm": "SPHINCS+-SHAKE-128s",
     "usage": "Credential signing, doc encryption", "status": "pqc"},
    {"dept_id": "UIDAI", "name": "UIDAI / Aadhaar", "algorithm": "ML-DSA-44",
     "usage": "eKYC attestation, biometric binding", "status": "pqc"},
    {"dept_id": "CBSE_PQC", "name": "CBSE (PQC pilot)", "algorithm": "ML-DSA-44",
     "usage": "Marksheet signing", "status": "pqc"},
    # Hybrid departments
    {"dept_id": "MCA", "name": "Ministry of Corporate Affairs", "algorithm": "ML-DSA-44",
     "usage": "Director KYC, ROC filings", "status": "hybrid"},
    {"dept_id": "EPFO", "name": "EPFO", "algorithm": "ML-DSA-44",
     "usage": "UAN, contribution records", "status": "hybrid"},
    # Classical departments (still on classical crypto — use RSA/ECDSA via a passthrough)
    {"dept_id": "REVENUE", "name": "Revenue Dept (State)", "algorithm": "RSA-2048",
     "usage": "Land record signatures", "status": "classical"},
    {"dept_id": "MUNICIPAL", "name": "Municipal Corporation", "algorithm": "ECDSA-P256",
     "usage": "Trade licence issuance", "status": "classical"},
    {"dept_id": "STATE_HEALTH", "name": "State Health Dept", "algorithm": "RSA-2048",
     "usage": "Health record attestation", "status": "classical"},
    {"dept_id": "SEBI", "name": "SEBI", "algorithm": "ECDSA-P384",
     "usage": "Investor KYC docs", "status": "classical"},
]
```

---

## main.py

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import sign, keys, departments, sessions, cbom
from db.models import Base
from sqlalchemy import create_engine

engine = create_engine("sqlite:///govsign.db")
Base.metadata.create_all(engine)

app = FastAPI(title="GovSign API", version="1.0.0", description="PQC Government Signing Service")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(sign.router, prefix="/sign", tags=["signing"])
app.include_router(keys.router, prefix="/pubkeys", tags=["keys"])
app.include_router(departments.router, prefix="/departments", tags=["departments"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(cbom.router, prefix="/cbom", tags=["cbom"])

@app.get("/health")
def health():
    import oqs
    return {"status": "ok", "liboqs_version": oqs.oqs_version()}
```

---

## Running the Service

```bash
cd services/govsign
pip install -r requirements.txt
python seeds/seed_departments.py     # populate demo departments
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for the auto-generated Swagger UI.

Test signing:
```bash
curl -X POST http://localhost:8000/sign \
  -H "X-API-Key: govsign-itd-dev" \
  -H "Content-Type: application/json" \
  -d '{"doc_hash": "abc123", "doc_type": "income_certificate", "algorithm": "SPHINCS+-SHAKE-128s"}'
```

---

## Classical Algorithm Passthrough

For classical departments (RSA, ECDSA), GovSign still accepts sign requests but routes them through Python's `cryptography` library instead of liboqs. This allows the CBOM to record classical operations as `quantum_safe: false`. These entries appear as red rows in the dashboard. This is important for the demo — it proves the system can track the full migration spectrum.

```python
# In signer.py, add:
from cryptography.hazmat.primitives.asymmetric import ec, rsa, padding
from cryptography.hazmat.primitives import hashes

CLASSICAL_ALGORITHMS = {"RSA-2048", "ECDSA-P256", "ECDSA-P384", "RSA-4096"}

def is_quantum_safe(algorithm: str) -> bool:
    return algorithm not in CLASSICAL_ALGORITHMS
```
