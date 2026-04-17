"""
Revenue Department issuer — Classical (RSA-2048).
Issues land ownership records. Deliberately insecure for demo contrast.
"""
import httpx
import uuid
import hashlib
import json
from datetime import datetime, timedelta, timezone
from models import SignedCredential
from demo_citizens import DEMO_CITIZENS
from config import GOVSIGN_HOST, REVENUE_API_KEY


async def issue_land_ownership(citizen_id: str) -> SignedCredential:
    """Issues a land ownership record signed with RSA-2048 (classical — not quantum-safe)."""
    citizen = DEMO_CITIZENS.get(citizen_id)
    if not citizen or not citizen.get("land_parcel"):
        raise ValueError(f"No land record for citizen: {citizen_id}")

    credential_id = str(uuid.uuid4())
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(days=365)

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

    async with httpx.AsyncClient(timeout=30.0) as client:
        sign_response = await client.post(
            f"{GOVSIGN_HOST}/sign",
            headers={"X-API-Key": REVENUE_API_KEY, "Content-Type": "application/json"},
            json={"doc_hash": doc_hash, "doc_type": "land_ownership", "algorithm": "RSA-2048"},
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
        expires_at=expires_at.isoformat(),
        attributes=attributes,
        sig_id=sig_data["sig_id"],
        signature_b64=sig_data["signature_b64"],
        algorithm="RSA-2048",
        quantum_safe=False,
        issuer_public_key_b64=pk_data["public_key_b64"],
    )
