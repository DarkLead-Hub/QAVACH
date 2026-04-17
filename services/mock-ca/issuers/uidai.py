"""
UIDAI issuer — PQC (ML-DSA-44).
Issues Aadhaar eKYC attestations for demo citizens.
"""
import httpx
import uuid
import hashlib
import json
from datetime import datetime, timedelta, timezone
from models import SignedCredential
from demo_citizens import DEMO_CITIZENS
from config import GOVSIGN_HOST, UIDAI_API_KEY


async def issue_aadhaar_attestation(citizen_id: str) -> SignedCredential:
    """Issues an Aadhaar eKYC attestation for a demo citizen via GovSign."""
    citizen = DEMO_CITIZENS.get(citizen_id)
    if not citizen:
        raise ValueError(f"Unknown citizen: {citizen_id}")

    credential_id = str(uuid.uuid4())
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(days=365)

    # Extract state from address
    address = citizen["address"]
    state = address.split(",")[-1].strip().split(" ")[0] if "," in address else "Unknown"

    attributes = {
        "name_verified": True,
        "address_verified": True,
        "dob_year": 1995,
        "gender": "F" if citizen["name"].split()[0] in ["Priya", "Ananya"] else "M",
        "state": state,
    }

    doc_payload = {
        "credential_id": credential_id,
        "credential_type": "aadhaar_attestation",
        "issuer": "UIDAI",
        "citizen_id_hash": citizen["aadhaar_hash"],
        "issued_at": issued_at.isoformat(),
        "expires_at": expires_at.isoformat(),
        "attributes": attributes,
    }
    doc_bytes = json.dumps(doc_payload, sort_keys=True).encode()
    doc_hash = hashlib.sha3_256(doc_bytes).hexdigest()

    async with httpx.AsyncClient(timeout=30.0) as client:
        sign_response = await client.post(
            f"{GOVSIGN_HOST}/sign",
            headers={"X-API-Key": UIDAI_API_KEY, "Content-Type": "application/json"},
            json={
                "doc_hash": doc_hash,
                "doc_type": "aadhaar_attestation",
                "algorithm": "ML-DSA-44",
            },
        )
        sign_response.raise_for_status()
        sig_data = sign_response.json()

        pk_response = await client.get(f"{GOVSIGN_HOST}/pubkeys/UIDAI")
        pk_data = pk_response.json()

    return SignedCredential(
        credential_id=credential_id,
        credential_type="aadhaar_attestation",
        issuer_dept_id="UIDAI",
        citizen_id_hash=citizen["aadhaar_hash"],
        issued_at=issued_at.isoformat(),
        expires_at=expires_at.isoformat(),
        attributes=attributes,
        sig_id=sig_data["sig_id"],
        signature_b64=sig_data["signature_b64"],
        algorithm="ML-DSA-44",
        quantum_safe=True,
        issuer_public_key_b64=pk_data["public_key_b64"],
    )
