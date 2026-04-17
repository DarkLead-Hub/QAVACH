"""
GET /cbom — returns CBOM data for the dashboard
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from middleware.auth import get_db, verify_admin_key
from db.cbom import get_cbom_summary, get_department_cbom_data, get_recent_entries

router = APIRouter()


@router.get("")
async def get_cbom(
    status: Optional[str] = Query(None, description="Filter: pqc|hybrid|classical|pending"),
    _admin: bool = Depends(verify_admin_key),
    db: Session = Depends(get_db),
):
    """Returns CBOM data for the dashboard. Admin key required."""
    summary = get_cbom_summary(db)
    departments = get_department_cbom_data(db, status_filter=status)
    recent = get_recent_entries(db, limit=20)

    return {
        "summary": summary,
        "departments": departments,
        "recent_entries": recent,
    }
