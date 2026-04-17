"""
Income Tax Department issuer — PQC (SLH-DSA-SHAKE-128s).
Issues income certificates for demo citizens.
"""
import httpx
import uuid
import hashlib
import json
from datetime import datetime, timedelta, timezone
from models import SignedCredential
from demo_citizens import DEMO_CITIZENS
from config import GOVSIGN_HOST, ITD_API_KEY


async def issue_income_certificate(citizen_id: str) -> SignedCredential:
    """Issues an income certificate for a demo citizen via GovSign."""
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
        "cibil_signal": citizen.get("cibil_signal", "unknown"),
    }

    # Build document payload for hashing
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
    async with httpx.AsyncClient(timeout=30.0) as client:
        sign_response = await client.post(
            f"{GOVSIGN_HOST}/sign",
            headers={"X-API-Key": ITD_API_KEY, "Content-Type": "application/json"},
            json={
                "doc_hash": doc_hash,
                "doc_type": "income_certificate",
                "algorithm": "SLH_DSA_PURE_SHAKE_128S",
            },
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
