"""
State Health Department issuer — Classical (RSA-2048).
Issues health ID records.
"""
import httpx
import uuid
import hashlib
import json
from datetime import datetime, timedelta, timezone
from models import SignedCredential
from demo_citizens import DEMO_CITIZENS
from config import GOVSIGN_HOST, STATE_HEALTH_API_KEY


async def issue_health_record(citizen_id: str) -> SignedCredential:
    """Issues a health ID record signed with RSA-2048."""
    citizen = DEMO_CITIZENS.get(citizen_id)
    if not citizen:
        raise ValueError(f"Unknown citizen: {citizen_id}")

    credential_id = str(uuid.uuid4())
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(days=365)

    attributes = {
        "health_id": citizen["health_id"],
        "blood_group": "B+",
        "last_checkup_year": 2024,
    }

    doc_payload = {
        "credential_id": credential_id,
        "credential_type": "health_record",
        "issuer": "STATE_HEALTH",
        "citizen_id_hash": citizen["aadhaar_hash"],
        "issued_at": issued_at.isoformat(),
        "attributes": attributes,
    }
    doc_bytes = json.dumps(doc_payload, sort_keys=True).encode()
    doc_hash = hashlib.sha3_256(doc_bytes).hexdigest()

    async with httpx.AsyncClient(timeout=30.0) as client:
        sign_response = await client.post(
            f"{GOVSIGN_HOST}/sign",
            headers={"X-API-Key": STATE_HEALTH_API_KEY, "Content-Type": "application/json"},
            json={"doc_hash": doc_hash, "doc_type": "health_record", "algorithm": "RSA-2048"},
        )
        sign_response.raise_for_status()
        sig_data = sign_response.json()

        pk_response = await client.get(f"{GOVSIGN_HOST}/pubkeys/STATE_HEALTH")
        pk_data = pk_response.json()

    return SignedCredential(
        credential_id=credential_id,
        credential_type="health_record",
        issuer_dept_id="STATE_HEALTH",
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
