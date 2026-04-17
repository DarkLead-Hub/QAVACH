"""
Seed demo departments with correct algorithms and quantum statuses.
Run: cd services/govsign && python seeds/seed_departments.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.models import Base, Department
from crypto.keys import store_keypair
from config import DATABASE_URL

SEED_DEPARTMENTS = [
    # PQC departments
    {"dept_id": "ITD", "name": "Income Tax Department",
     "algorithm": "SPHINCS+-SHAKE-128s-simple",
     "usage": "Credential signing, doc encryption", "status": "pqc"},
    {"dept_id": "UIDAI", "name": "UIDAI / Aadhaar",
     "algorithm": "ML-DSA-44",
     "usage": "eKYC attestation, biometric binding", "status": "pqc"},
    {"dept_id": "CBSE_PQC", "name": "CBSE (PQC pilot)",
     "algorithm": "ML-DSA-44",
     "usage": "Marksheet signing", "status": "pqc"},
    # Hybrid departments
    {"dept_id": "MCA", "name": "Ministry of Corporate Affairs",
     "algorithm": "ML-DSA-44",
     "usage": "Director KYC, ROC filings", "status": "hybrid"},
    {"dept_id": "EPFO", "name": "EPFO",
     "algorithm": "ML-DSA-44",
     "usage": "UAN, contribution records", "status": "hybrid"},
    # Classical departments (still on classical crypto)
    {"dept_id": "REVENUE", "name": "Revenue Dept (State)",
     "algorithm": "RSA-2048",
     "usage": "Land record signatures", "status": "classical"},
    {"dept_id": "MUNICIPAL", "name": "Municipal Corporation",
     "algorithm": "ECDSA-P256",
     "usage": "Trade licence issuance", "status": "classical"},
    {"dept_id": "STATE_HEALTH", "name": "State Health Dept",
     "algorithm": "RSA-2048",
     "usage": "Health record attestation", "status": "classical"},
    {"dept_id": "SEBI", "name": "SEBI",
     "algorithm": "ECDSA-P384",
     "usage": "Investor KYC docs", "status": "classical"},
]


def seed_database():
    print(f"Connecting to database at {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    print("Checking existing departments...")
    for dept_data in SEED_DEPARTMENTS:
        dept_id = dept_data["dept_id"]

        # Skip if already exists
        existing = db.query(Department).filter(Department.dept_id == dept_id).first()
        if existing:
            print(f"  [skip] {dept_id} already exists")
            continue

        # Generate and store keypair
        pub_key_b64, priv_key_path = store_keypair(dept_id, dept_data["algorithm"])

        # Deterministic API key for dev
        api_key = f"govsign-{dept_id.lower()}-dev"

        dept = Department(
            dept_id=dept_id,
            name=dept_data["name"],
            algorithm=dept_data["algorithm"],
            usage_description=dept_data["usage"],
            quantum_status=dept_data["status"],
            api_key=api_key,
            public_key_b64=pub_key_b64,
            private_key_path=priv_key_path,
        )
        db.add(dept)
        print(f"  [seed] {dept_id} — {dept_data['name']} ({dept_data['algorithm']}) — api_key: {api_key}")

    db.commit()
    db.close()
    print("\nDone. All departments seeded.")


if __name__ == "__main__":
    print("Seeding GovSign departments...")
    seed_database()
