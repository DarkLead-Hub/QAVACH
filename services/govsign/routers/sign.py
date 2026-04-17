"""
POST /sign — sign a document hash
POST /verify — verify a signature envelope
"""
import json
import base64
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from middleware.auth import get_db, verify_api_key
from db.models import Department
from db.cbom import create_cbom_entry
from crypto.signer import (
    sign_document_hash, verify_signature, is_quantum_safe,
    get_liboqs_name, get_nist_name, CLASSICAL_ALGORITHMS,
)
from crypto.keys import load_private_key, load_public_key_bytes

router = APIRouter()


class SignRequest(BaseModel):
    doc_hash: str
    doc_type: str
    algorithm: Optional[str] = None  # if None, uses department's registered algorithm


class VerifyRequest(BaseModel):
    doc_hash: str
    dept_id: str
    signature_b64: str
    signed_at: str
    sig_id: str
    doc_type: Optional[str] = None
    algorithm: Optional[str] = None


@router.post("")
async def sign_document(
    body: SignRequest,
    dept: Department = Depends(verify_api_key),
    db: Session = Depends(get_db),
):
    """Department submits a document hash to be signed."""
    algorithm = body.algorithm or dept.algorithm

    # If algorithm in request differs from dept's registered algorithm, return 400
    if body.algorithm and body.algorithm != dept.algorithm:
        # Allow liboqs/NIST name equivalents
        if get_nist_name(body.algorithm) != get_nist_name(dept.algorithm):
            raise HTTPException(
                status_code=400,
                detail=f"Algorithm mismatch: requested {body.algorithm}, "
                       f"department registered with {dept.algorithm}"
            )

    # Load private key
    if not dept.private_key_path:
        raise HTTPException(status_code=500, detail="Department has no private key configured")

    private_key = load_private_key(dept.private_key_path)

    # Sign the document
    result = sign_document_hash(
        algorithm=dept.algorithm,
        private_key_bytes=private_key,
        doc_hash_hex=body.doc_hash,
        dept_id=dept.dept_id,
        doc_type=body.doc_type,
    )

    # Log CBOM entry
    entry = create_cbom_entry(
        db=db,
        dept_id=dept.dept_id,
        algorithm=get_nist_name(dept.algorithm),
        doc_type=body.doc_type,
        operation="sign",
        quantum_safe=is_quantum_safe(dept.algorithm),
    )

    result["cbom_entry_id"] = entry.id
    return result


@router.post("/verify")
async def verify_document(
    body: VerifyRequest,
    db: Session = Depends(get_db),
):
    """Verify a signature envelope. Used by portals."""
    # Look up department
    dept = db.query(Department).filter(Department.dept_id == body.dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail=f"Department {body.dept_id} not found")

    algorithm = body.algorithm or dept.algorithm
    quantum_safe = is_quantum_safe(algorithm)

    # Reconstruct the envelope for verification
    envelope_data = {
        "doc_hash": body.doc_hash,
        "dept_id": body.dept_id,
        "doc_type": body.doc_type or "",
        "algorithm": get_nist_name(algorithm),
        "signed_at": body.signed_at,
        "sig_id": body.sig_id,
    }
    payload_bytes = json.dumps(envelope_data, sort_keys=True).encode()
    signature_bytes = base64.b64decode(body.signature_b64)
    public_key_bytes = load_public_key_bytes(dept.public_key_b64)

    # Verify signature
    if quantum_safe:
        valid = verify_signature(algorithm, public_key_bytes, payload_bytes, signature_bytes)
    else:
        # Classical mock verification
        from crypto.signer import _classical_verify
        valid = _classical_verify(algorithm, public_key_bytes, payload_bytes, signature_bytes)

    # Log CBOM entry
    create_cbom_entry(
        db=db,
        dept_id=dept.dept_id,
        algorithm=get_nist_name(algorithm),
        doc_type=body.doc_type or "",
        operation="verify",
        quantum_safe=quantum_safe,
    )

    return {
        "valid": valid,
        "dept_id": dept.dept_id,
        "algorithm": get_nist_name(algorithm),
        "quantum_safe": quantum_safe,
        "dept_name": dept.name,
    }
