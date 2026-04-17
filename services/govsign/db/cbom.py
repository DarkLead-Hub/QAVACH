"""
CBOM (Cryptography Bill of Materials) read/write operations.
"""
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from .models import CbomEntry, Department


def create_cbom_entry(db: Session, dept_id: str, algorithm: str,
                      doc_type: str, operation: str, quantum_safe: bool) -> CbomEntry:
    """Log a cryptographic operation to the CBOM registry."""
    entry = CbomEntry(
        id=str(uuid.uuid4()),
        dept_id=dept_id,
        algorithm=algorithm,
        doc_type=doc_type,
        operation=operation,
        quantum_safe=quantum_safe,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_cbom_summary(db: Session) -> dict:
    """Get aggregate counts of departments by quantum status."""
    departments = db.query(Department).filter(Department.is_active == True).all()
    summary = {"total": 0, "pqc": 0, "hybrid": 0, "classical": 0, "pending": 0}
    for dept in departments:
        summary["total"] += 1
        status = dept.quantum_status
        if status in summary:
            summary[status] += 1
    return summary


def get_department_cbom_data(db: Session, status_filter: str = None) -> list:
    """Get department data enriched with CBOM stats."""
    query = db.query(Department).filter(Department.is_active == True)
    if status_filter and status_filter != "all":
        query = query.filter(Department.quantum_status == status_filter)

    departments = query.all()
    result = []

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

    for dept in departments:
        # Count signs in last 30 days
        sign_count = db.query(func.count(CbomEntry.id)).filter(
            CbomEntry.dept_id == dept.dept_id,
            CbomEntry.timestamp >= thirty_days_ago,
        ).scalar() or 0

        # Last sign timestamp
        last_entry = db.query(CbomEntry).filter(
            CbomEntry.dept_id == dept.dept_id,
        ).order_by(CbomEntry.timestamp.desc()).first()

        # Quantum risk assessment
        risk = _assess_risk(dept.quantum_status, sign_count)

        result.append({
            "dept_id": dept.dept_id,
            "name": dept.name,
            "algorithm": dept.algorithm,
            "usage": dept.usage_description or "",
            "quantum_status": dept.quantum_status,
            "quantum_risk": risk,
            "sign_count_30d": sign_count,
            "last_sign_at": last_entry.timestamp.isoformat() if last_entry else None,
        })

    return result


def get_recent_entries(db: Session, limit: int = 20) -> list:
    """Get the most recent CBOM entries."""
    entries = db.query(CbomEntry).order_by(
        CbomEntry.timestamp.desc()
    ).limit(limit).all()

    result = []
    for entry in entries:
        # Look up department name
        dept = db.query(Department).filter(Department.dept_id == entry.dept_id).first()
        result.append({
            "id": entry.id,
            "dept_id": entry.dept_id,
            "dept_name": dept.name if dept else entry.dept_id,
            "algorithm": entry.algorithm,
            "doc_type": entry.doc_type,
            "operation": entry.operation,
            "quantum_safe": entry.quantum_safe,
            "timestamp": entry.timestamp.isoformat(),
        })

    return result


def _assess_risk(quantum_status: str, sign_count: int) -> str:
    """Assess quantum risk level based on status and activity."""
    if quantum_status == "pqc":
        return "low"
    elif quantum_status == "hybrid":
        return "medium"
    elif quantum_status == "classical":
        return "high"
    else:
        return "medium"
