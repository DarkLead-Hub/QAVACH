# Mock Issuer CA — Complete Build Specification

## What This Is

The Mock Issuer CA simulates the government document issuance infrastructure that does not yet exist in India. In a production system, the Income Tax Department, UIDAI, and Revenue departments would run their own signing infrastructure. For this demo, this service stands in for all of them.

It issues signed mock credentials — income certificates, Aadhaar attestations, land ownership records — using the same SLH-DSA/ML-DSA keys that are registered with GovSign. The QAVACH app downloads these documents at onboarding time, just like DigiLocker.

**Build this immediately after GovSign. It depends only on GovSign being seeded.**

---

## Tech Stack

- **Runtime:** Python 3.11+
- **Framework:** FastAPI
- **PQC:** liboqs-python (same install as GovSign)
- **Port:** 8001

---

## Project Structure

```
services/mock-ca/
├── main.py
├── config.py
├── issuers/
│   ├── __init__.py
│   ├── income_tax.py        ← Issues income certificates
│   ├── uidai.py             ← Issues Aadhaar eKYC attestations
│   ├── revenue.py           ← Issues land ownership (RSA — deliberately classical)
│   └── health.py            ← Issues health ID records (RSA — deliberately classical)
├── models.py                ← Pydantic models for all credential types
├── demo_citizens.py         ← Hardcoded demo citizens for the hackathon
└── requirements.txt
```

---

## Demo Citizens

The entire demo uses three hardcoded citizens. Keep these consistent across all services.

```python
# demo_citizens.py
DEMO_CITIZENS = {
    "CITIZEN_001": {
        "name": "Priya Sharma",
        "aadhaar_hash": "sha256:a1b2c3d4e5f6...",  # never the real number
        "annual_income": 210000,       # ₹2.1L — ELIGIBLE for income < 3L claims
        "pan": "ABCPS1234D",
        "address": "12, MG Road, Bangalore, KA 560001",
        "land_parcel": "KA-BLR-001",
        "land_area_sqft": 1200,
        "health_id": "14-1234-5678-9012",
    },
    "CITIZEN_002": {
        "name": "Rahul Mehta",
        "aadhaar_hash": "sha256:b2c3d4e5f6a1...",
        "annual_income": 480000,       # ₹4.8L — NOT eligible for income < 3L
        "pan": "BCPRM2345E",
        "address": "45, Linking Road, Mumbai, MH 400050",
        "land_parcel": None,
        "health_id": "14-2345-6789-0123",
    },
    "CITIZEN_003": {
        "name": "Ananya Patel",
        "aadhaar_hash": "sha256:c3d4e5f6a1b2...",
        "annual_income": 180000,       # ₹1.8L — ELIGIBLE
        "pan": "CDPAP3456F",
        "address": "8, Sector 15, Chandigarh, PB 160015",
        "land_parcel": "CH-SEC15-008",
        "land_area_sqft": 900,
        "health_id": "14-3456-7890-1234",
    },
}
```

---

## Credential Schemas

All credentials follow this base structure:

```python
# models.py
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class SignedCredential(BaseModel):
    """Base for all issued credentials"""
    credential_id: str          # uuid
    credential_type: str        # "income_certificate" | "aadhaar_attestation" | etc.
    issuer_dept_id: str         # "ITD" | "UIDAI" | etc.
    citizen_id_hash: str        # sha256 of Aadhaar — never the number itself
    issued_at: str              # ISO8601
    expires_at: str             # ISO8601 — 1 year from issue
    attributes: Dict[str, Any]  # type-specific fields (see below)
    
    # Signature envelope (populated by GovSign)
    sig_id: str
    signature_b64: str
    algorithm: str              # e.g. "SLH-DSA-SHAKE-128s"
    quantum_safe: bool
    issuer_public_key_b64: str  # embedded so QAVACH can verify offline

# Income Certificate attributes
class IncomeCertificateAttrs(BaseModel):
    annual_income: int          # in INR
    financial_year: str         # "2023-24"
    income_source: str          # "salary" | "business" | "agriculture"
    pan_last4: str              # last 4 chars of PAN only

# Aadhaar eKYC Attestation attributes
class AadhaarAttestationAttrs(BaseModel):
    name_verified: bool
    address_verified: bool
    dob_year: int               # year only, not full DOB
    gender: str
    state: str

# Land Ownership Record attributes
class LandOwnershipAttrs(BaseModel):
    parcel_id: str
    area_sqft: int
    district: str
    state: str
    ownership_type: str         # "freehold" | "leasehold"
```

---

## Income Certificate Issuer (PQC — SLH-DSA)

```python
# issuers/income_tax.py
import httpx, uuid, hashlib, json
from datetime import datetime, timedelta, timezone
from ..models import SignedCredential
from ..demo_citizens import DEMO_CITIZENS
from ..config import GOVSIGN_HOST, ITD_API_KEY

async def issue_income_certificate(citizen_id: str) -> SignedCredential:
    """
    Issues an income certificate for a demo citizen.
    Calls GovSign to sign with SLH-DSA-SHAKE-128s.
    """
    citizen = DEMO_CITIZENS.get(citizen_id)
    if not citizen:
        raise ValueError(f"Unknown citizen: {citizen_id}")

    credential_id = str(uuid.uuid4())
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(days=365)

    attributes = {
        "annual_income": citizen["annual_income"],
        "financial_year": "2023-24",
        "income_source": "salary",
        "pan_last4": citizen["pan"][-4:],
    }

    # Build the document payload that will be hashed and signed
    doc_payload = {
        "credential_id": credential_id,
        "credential_type": "income_certificate",
        "issuer": "ITD",
        "citizen_id_hash": citizen["aadhaar_hash"],
        "issued_at": issued_at.isoformat(),
        "expires_at": expires_at.isoformat(),
        "attributes": attributes,
    }
    doc_bytes = json.dumps(doc_payload, sort_keys=True).encode()
    doc_hash = hashlib.sha3_256(doc_bytes).hexdigest()

    # Call GovSign to sign
    async with httpx.AsyncClient() as client:
        sign_response = await client.post(
            f"{GOVSIGN_HOST}/sign",
            headers={"X-API-Key": ITD_API_KEY},
            json={
                "doc_hash": doc_hash,
                "doc_type": "income_certificate",
                "algorithm": "SPHINCS+-SHAKE-128s",
            }
        )
        sign_response.raise_for_status()
        sig_data = sign_response.json()

        # Fetch ITD public key for embedding
        pk_response = await client.get(f"{GOVSIGN_HOST}/pubkeys/ITD")
        pk_data = pk_response.json()

    return SignedCredential(
        credential_id=credential_id,
        credential_type="income_certificate",
        issuer_dept_id="ITD",
        citizen_id_hash=citizen["aadhaar_hash"],
        issued_at=issued_at.isoformat(),
        expires_at=expires_at.isoformat(),
        attributes=attributes,
        sig_id=sig_data["sig_id"],
        signature_b64=sig_data["signature_b64"],
        algorithm="SLH-DSA-SHAKE-128s",
        quantum_safe=True,
        issuer_public_key_b64=pk_data["public_key_b64"],
    )
```

---

## Land Record Issuer (Classical — RSA, deliberately insecure for demo contrast)

```python
# issuers/revenue.py
# This issuer uses RSA-2048 — a deliberate choice to show the migration gap.
# The QAVACH app will mark credentials from this issuer as "not quantum-safe".
# The CBOM dashboard will show Revenue Dept as red / high-risk.

import httpx, uuid, hashlib, json
from datetime import datetime, timedelta, timezone
from ..models import SignedCredential
from ..demo_citizens import DEMO_CITIZENS
from ..config import GOVSIGN_HOST, REVENUE_API_KEY

async def issue_land_ownership(citizen_id: str) -> SignedCredential:
    citizen = DEMO_CITIZENS.get(citizen_id)
    if not citizen or not citizen.get("land_parcel"):
        raise ValueError(f"No land record for citizen: {citizen_id}")

    credential_id = str(uuid.uuid4())
    issued_at = datetime.now(timezone.utc)

    attributes = {
        "parcel_id": citizen["land_parcel"],
        "area_sqft": citizen["land_area_sqft"],
        "district": "Bangalore Urban",
        "state": "Karnataka",
        "ownership_type": "freehold",
    }

    doc_payload = {
        "credential_id": credential_id,
        "credential_type": "land_ownership",
        "issuer": "REVENUE",
        "citizen_id_hash": citizen["aadhaar_hash"],
        "issued_at": issued_at.isoformat(),
        "attributes": attributes,
    }
    doc_bytes = json.dumps(doc_payload, sort_keys=True).encode()
    doc_hash = hashlib.sha3_256(doc_bytes).hexdigest()

    # GovSign will route RSA-2048 through classical crypto path
    # and log quantum_safe: false in CBOM
    async with httpx.AsyncClient() as client:
        sign_response = await client.post(
            f"{GOVSIGN_HOST}/sign",
            headers={"X-API-Key": REVENUE_API_KEY},
            json={"doc_hash": doc_hash, "doc_type": "land_ownership", "algorithm": "RSA-2048"}
        )
        sign_response.raise_for_status()
        sig_data = sign_response.json()
        pk_response = await client.get(f"{GOVSIGN_HOST}/pubkeys/REVENUE")
        pk_data = pk_response.json()

    return SignedCredential(
        credential_id=credential_id,
        credential_type="land_ownership",
        issuer_dept_id="REVENUE",
        citizen_id_hash=citizen["aadhaar_hash"],
        issued_at=issued_at.isoformat(),
        expires_at=(issued_at + timedelta(days=365)).isoformat(),
        attributes=attributes,
        sig_id=sig_data["sig_id"],
        signature_b64=sig_data["signature_b64"],
        algorithm="RSA-2048",
        quantum_safe=False,       # ← explicitly false
        issuer_public_key_b64=pk_data["public_key_b64"],
    )
```

---

## API Endpoints

### GET /credentials/{citizen_id}
Returns all credentials for a citizen. This is what the QAVACH app calls at onboarding.

**Response 200:**
```json
{
  "citizen_id": "CITIZEN_001",
  "citizen_name": "Priya Sharma",
  "credentials": [
    {
      "credential_id": "uuid",
      "credential_type": "income_certificate",
      "issuer_dept_id": "ITD",
      "algorithm": "SLH-DSA-SHAKE-128s",
      "quantum_safe": true,
      "issued_at": "ISO8601",
      "expires_at": "ISO8601",
      "attributes": { "annual_income": 210000, "financial_year": "2023-24" },
      "sig_id": "uuid",
      "signature_b64": "base64...",
      "issuer_public_key_b64": "base64..."
    },
    {
      "credential_id": "uuid",
      "credential_type": "land_ownership",
      "issuer_dept_id": "REVENUE",
      "algorithm": "RSA-2048",
      "quantum_safe": false,
      "attributes": { "parcel_id": "KA-BLR-001", "area_sqft": 1200 }
    }
  ]
}
```

### POST /credentials/issue
Issues all credentials for a citizen. Called once at setup time.

**Request:**
```json
{ "citizen_id": "CITIZEN_001" }
```

### GET /health
```json
{ "status": "ok", "govsign_connected": true }
```

---

## Running the Service

```bash
cd services/mock-ca
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Seed credentials for all demo citizens:
```bash
curl -X POST http://localhost:8001/credentials/issue -d '{"citizen_id": "CITIZEN_001"}'
curl -X POST http://localhost:8001/credentials/issue -d '{"citizen_id": "CITIZEN_002"}'
curl -X POST http://localhost:8001/credentials/issue -d '{"citizen_id": "CITIZEN_003"}'
```
