"""
Mock Issuer CA — simulates government document issuance infrastructure.
Issues signed credentials for demo citizens via GovSign.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List
from demo_citizens import DEMO_CITIZENS
from models import SignedCredential

app = FastAPI(
    title="Mock Issuer CA",
    version="1.0.0",
    description="Simulated government CA — issues PQC-signed credentials for QAVACH demo",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory credential store (simple dict for demo)
credential_store: Dict[str, List[dict]] = {}


class IssueRequest(BaseModel):
    citizen_id: str


@app.post("/credentials/issue")
async def issue_credentials(body: IssueRequest):
    """Issue all credentials for a citizen. Called once at setup time."""
    citizen_id = body.citizen_id
    citizen = DEMO_CITIZENS.get(citizen_id)
    if not citizen:
        raise HTTPException(status_code=404, detail=f"Unknown citizen: {citizen_id}")

    credentials = []

    # 1. Income certificate (PQC — SLH-DSA)
    try:
        from issuers.income_tax import issue_income_certificate
        income_cred = await issue_income_certificate(citizen_id)
        credentials.append(income_cred.model_dump())
    except Exception as e:
        print(f"[warn] Failed to issue income cert for {citizen_id}: {e.__class__.__name__}: {str(e)}")

    # 2. Aadhaar attestation (PQC — ML-DSA-44)
    try:
        from issuers.uidai import issue_aadhaar_attestation
        aadhaar_cred = await issue_aadhaar_attestation(citizen_id)
        credentials.append(aadhaar_cred.model_dump())
    except Exception as e:
        print(f"[warn] Failed to issue Aadhaar attestation for {citizen_id}: {e.__class__.__name__}: {str(e)}")

    # 3. Land ownership (Classical — RSA-2048) — only for citizens with land
    if citizen.get("land_parcel"):
        try:
            from issuers.revenue import issue_land_ownership
            land_cred = await issue_land_ownership(citizen_id)
            credentials.append(land_cred.model_dump())
        except Exception as e:
            print(f"[warn] Failed to issue land record for {citizen_id}: {e.__class__.__name__}: {str(e)}")

    # 4. Health record (Classical — RSA-2048)
    try:
        from issuers.health import issue_health_record
        health_cred = await issue_health_record(citizen_id)
        credentials.append(health_cred.model_dump())
    except Exception as e:
        print(f"[warn] Failed to issue health record for {citizen_id}: {e.__class__.__name__}: {str(e)}")

    # Store credentials
    credential_store[citizen_id] = credentials

    return {
        "citizen_id": citizen_id,
        "citizen_name": citizen["name"],
        "credentials_issued": len(credentials),
        "credentials": credentials,
    }


@app.get("/credentials/{citizen_id}")
async def get_credentials(citizen_id: str):
    """Returns all credentials for a citizen. Called by QAVACH app at onboarding."""
    citizen = DEMO_CITIZENS.get(citizen_id)
    if not citizen:
        raise HTTPException(status_code=404, detail=f"Unknown citizen: {citizen_id}")

    credentials = credential_store.get(citizen_id, [])

    return {
        "citizen_id": citizen_id,
        "citizen_name": citizen["name"],
        "credentials": credentials,
    }


@app.get("/health")
async def health():
    """Health check."""
    import httpx
    from config import GOVSIGN_HOST

    govsign_ok = False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{GOVSIGN_HOST}/health")
            govsign_ok = resp.status_code == 200
    except Exception:
        pass

    return {
        "status": "ok",
        "govsign_connected": govsign_ok,
        "citizens_available": list(DEMO_CITIZENS.keys()),
    }
