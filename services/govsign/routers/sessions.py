"""
POST /sessions — create PGCA challenge session
POST /sessions/{session_id}/proof — submit PGCA proof
GET /sessions/{session_id} — poll session status
"""
import uuid
import secrets
import json
import base64
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from middleware.auth import get_db, verify_api_key
from db.models import PgcaSession, Department
from db.cbom import create_cbom_entry
from crypto.signer import verify_signature, get_nist_name, is_quantum_safe
from crypto.keys import load_public_key_bytes
from config import GOVSIGN_HOST

router = APIRouter()


class SessionCreate(BaseModel):
    claim_type: str
    portal_id: str
    ttl_seconds: Optional[int] = 300


class ProofSubmit(BaseModel):
    session_id: str
    nonce: str
    claim_type: str
    claim_value: bool
    citizen_id_hash: str
    issuer_dept_id: str
    doc_sig_id: str
    proof_signature_b64: str
    citizen_pub_key_b64: str


@router.post("")
async def create_session(
    body: SessionCreate,
    dept: Department = Depends(verify_api_key),
    db: Session = Depends(get_db),
):
    """Portal creates a PGCA session before displaying a QR code."""
    session_id = str(uuid.uuid4())
    nonce = secrets.token_hex(32)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=body.ttl_seconds)

    callback_url = f"{GOVSIGN_HOST}/sessions/{session_id}/proof"

    session = PgcaSession(
        session_id=session_id,
        nonce=nonce,
        claim_type=body.claim_type,
        portal_id=body.portal_id,
        status="pending",
        created_at=now,
        expires_at=expires_at,
    )
    db.add(session)
    db.commit()

    # QR payload — compact keys to stay under 150 bytes
    qr_payload = {
        "s": session_id,
        "n": nonce,
        "c": body.claim_type,
        "cb": callback_url,
    }

    return {
        "session_id": session_id,
        "nonce": nonce,
        "claim_type": body.claim_type,
        "callback_url": callback_url,
        "qr_payload": qr_payload,
        "expires_at": expires_at.isoformat(),
    }


@router.post("/{session_id}/proof")
async def submit_proof(
    session_id: str,
    body: ProofSubmit,
    db: Session = Depends(get_db),
):
    """
    QAVACH app POSTs the signed proof here after OPA evaluation passes.
    No API key required — called by citizen devices.
    """
    # 1. Check session exists and is "pending"
    session = db.query(PgcaSession).filter(
        PgcaSession.session_id == session_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "pending":
        raise HTTPException(status_code=409, detail=f"Session is {session.status}, not pending")

    # 2. Check nonce matches
    if body.nonce != session.nonce:
        raise HTTPException(status_code=400, detail="Nonce mismatch")

    # 3. Check session not expired
    now = datetime.now(timezone.utc)
    expires = session.expires_at.replace(tzinfo=timezone.utc) if session.expires_at and session.expires_at.tzinfo is None else session.expires_at
    if expires and now > expires:
        session.status = "expired"
        db.commit()
        raise HTTPException(status_code=410, detail="Session expired")

    # 4. Look up issuer department
    issuer_dept = db.query(Department).filter(
        Department.dept_id == body.issuer_dept_id,
    ).first()
    if not issuer_dept:
        raise HTTPException(status_code=400, detail=f"Unknown issuer: {body.issuer_dept_id}")

    # 5. Verify proof signature using citizen's public key
    # Use compact separators to match Dart's jsonEncode output (no spaces)
    proof_payload = json.dumps({
        "nonce": body.nonce,
        "claim_type": body.claim_type,
        "claim_value": body.claim_value,
        "citizen_id_hash": body.citizen_id_hash,
        "issuer_dept_id": body.issuer_dept_id,
        "doc_sig_id": body.doc_sig_id,
    }, sort_keys=True, separators=(',', ':')).encode()

    citizen_pub_key = base64.b64decode(body.citizen_pub_key_b64)
    proof_sig = base64.b64decode(body.proof_signature_b64)

    # Citizens use ML-DSA-44 for proof signing
    valid = verify_signature("ML-DSA-44", citizen_pub_key, proof_payload, proof_sig)

    if valid and body.claim_value:
        session.status = "verified"
    else:
        session.status = "denied"

    verified_at = datetime.now(timezone.utc)

    session.proof_payload = json.dumps({
        "claim_value": body.claim_value,
        "citizen_id_hash": body.citizen_id_hash,
        "issuer_dept_id": body.issuer_dept_id,
        "verified_at": verified_at.isoformat(),
        "algorithm": "ML-DSA-44",
        "quantum_safe": is_quantum_safe("ML-DSA-44"),
        "issuer": issuer_dept.name,
    })
    db.commit()

    # 6. Write CBOM entry for the verification operation
    create_cbom_entry(
        db=db,
        dept_id=body.issuer_dept_id,
        algorithm="ML-DSA-44",
        doc_type=body.claim_type,
        operation="verify",
        quantum_safe=True,
    )

    return {
        "session_id": session_id,
        "status": session.status,
        "claim_type": body.claim_type,
        "claim_value": body.claim_value,
        "verified_at": verified_at.isoformat(),
        "issuer": issuer_dept.name,
        "algorithm": "ML-DSA-44",
        "quantum_safe": True,
    }


@router.get("/{session_id}")
async def get_session(session_id: str, db: Session = Depends(get_db)):
    """Portal polls this endpoint to check if citizen has submitted proof."""
    session = db.query(PgcaSession).filter(
        PgcaSession.session_id == session_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check expiry
    now = datetime.now(timezone.utc)
    expires = session.expires_at.replace(tzinfo=timezone.utc) if session.expires_at and session.expires_at.tzinfo is None else session.expires_at
    if session.status == "pending" and expires and now > expires:
        session.status = "expired"
        db.commit()

    result = None
    if session.proof_payload:
        result = json.loads(session.proof_payload)

    return {
        "session_id": session.session_id,
        "status": session.status,
        "claim_type": session.claim_type,
        "result": result,
    }
