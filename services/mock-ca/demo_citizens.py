"""
Hardcoded demo citizens for the hackathon.
Keep these consistent across all services.
"""

DEMO_CITIZENS = {
    "CITIZEN_001": {
        "name": "Priya Sharma",
        "aadhaar_hash": "sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        "annual_income": 210000,       # ₹2.1L — ELIGIBLE for income < 3L claims
        "pan": "ABCPS1234D",
        "address": "12, MG Road, Bangalore, KA 560001",
        "land_parcel": "KA-BLR-001",
        "land_area_sqft": 1200,
        "health_id": "14-1234-5678-9012",
        "cibil_signal": "positive",
    },
    "CITIZEN_002": {
        "name": "Rahul Mehta",
        "aadhaar_hash": "sha256:b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
        "annual_income": 480000,       # ₹4.8L — NOT eligible for income < 3L
        "pan": "BCPRM2345E",
        "address": "45, Linking Road, Mumbai, MH 400050",
        "land_parcel": None,
        "health_id": "14-2345-6789-0123",
        "cibil_signal": "negative",
    },
    "CITIZEN_003": {
        "name": "Ananya Patel",
        "aadhaar_hash": "sha256:c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
        "annual_income": 180000,       # ₹1.8L — ELIGIBLE
        "pan": "CDPAP3456F",
        "address": "8, Sector 15, Chandigarh, PB 160015",
        "land_parcel": "CH-SEC15-008",
        "land_area_sqft": 900,
        "health_id": "14-3456-7890-1234",
        "cibil_signal": "positive",
    },
}
