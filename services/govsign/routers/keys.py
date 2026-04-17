"""
GET /pubkeys/{dept_id} — public endpoint for department public keys
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from middleware.auth import get_db
from db.models import Department
from crypto.signer import get_nist_name, is_quantum_safe

router = APIRouter()


@router.get("/{dept_id}")
async def get_public_key(dept_id: str, db: Session = Depends(get_db)):
    """
    Public endpoint — no API key required.
    Returns the department's current public key for independent verification.
    """
    dept = db.query(Department).filter(
        Department.dept_id == dept_id,
        Department.is_active == True,
    ).first()

    if not dept:
        raise HTTPException(status_code=404, detail=f"Department {dept_id} not found")

    return {
        "dept_id": dept.dept_id,
        "name": dept.name,
        "algorithm": get_nist_name(dept.algorithm),
        "public_key_b64": dept.public_key_b64,
        "quantum_safe": is_quantum_safe(dept.algorithm),
        "registered_at": dept.registered_at.isoformat() if dept.registered_at else None,
    }
