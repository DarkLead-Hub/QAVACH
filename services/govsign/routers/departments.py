"""
POST /departments — register new department (admin)
GET /departments — list all departments
"""
import secrets
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from middleware.auth import get_db, verify_admin_key
from db.models import Department
from crypto.keys import store_keypair
from crypto.signer import get_nist_name

router = APIRouter()


class DepartmentCreate(BaseModel):
    dept_id: str
    name: str
    algorithm: str
    usage_description: Optional[str] = None
    quantum_status: Optional[str] = "pending"


@router.post("", status_code=201)
async def register_department(
    body: DepartmentCreate,
    _admin: bool = Depends(verify_admin_key),
    db: Session = Depends(get_db),
):
    """Register a new department. Admin key required."""
    # Check if already exists
    existing = db.query(Department).filter(Department.dept_id == body.dept_id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Department {body.dept_id} already exists")

    # Generate API key
    api_key = f"govsign-{body.dept_id.lower()}-{secrets.token_hex(8)}"

    # Generate and store keypair
    pub_key_b64, priv_key_path = store_keypair(body.dept_id, body.algorithm)

    dept = Department(
        dept_id=body.dept_id,
        name=body.name,
        algorithm=body.algorithm,
        usage_description=body.usage_description,
        quantum_status=body.quantum_status,
        api_key=api_key,
        public_key_b64=pub_key_b64,
        private_key_path=priv_key_path,
    )
    db.add(dept)
    db.commit()

    return {
        "dept_id": dept.dept_id,
        "api_key": api_key,
        "public_key_b64": pub_key_b64,
        "algorithm": get_nist_name(body.algorithm),
        "message": "Department registered. Store the api_key — it will not be shown again.",
    }


@router.get("")
async def list_departments(db: Session = Depends(get_db)):
    """List all active departments."""
    departments = db.query(Department).filter(Department.is_active == True).all()
    return [
        {
            "dept_id": d.dept_id,
            "name": d.name,
            "algorithm": get_nist_name(d.algorithm),
            "usage_description": d.usage_description,
            "quantum_status": d.quantum_status,
            "registered_at": d.registered_at.isoformat() if d.registered_at else None,
        }
        for d in departments
    ]
