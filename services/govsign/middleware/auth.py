"""
API key validation middleware.
"""
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from db.models import Department
from config import GOVSIGN_ADMIN_KEY


def get_db():
    """Database session dependency — injected by routers."""
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def verify_api_key(x_api_key: str = Header(...), db: Session = Depends(get_db)):
    """
    Validate the X-API-Key header against registered departments.
    Returns the department record if found.
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")

    dept = db.query(Department).filter(
        Department.api_key == x_api_key,
        Department.is_active == True,
    ).first()

    if not dept:
        raise HTTPException(status_code=403, detail="Invalid API key")

    return dept


async def verify_admin_key(x_api_key: str = Header(...)):
    """Validate the admin API key."""
    if x_api_key != GOVSIGN_ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Admin access required")
    return True
