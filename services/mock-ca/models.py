"""
Pydantic models for all credential types.
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any


class SignedCredential(BaseModel):
    """Base for all issued credentials."""
    credential_id: str
    credential_type: str
    issuer_dept_id: str
    citizen_id_hash: str
    issued_at: str
    expires_at: str
    attributes: Dict[str, Any]

    # Signature envelope (populated by GovSign)
    sig_id: str
    signature_b64: str
    algorithm: str
    quantum_safe: bool
    issuer_public_key_b64: str


class IncomeCertificateAttrs(BaseModel):
    annual_income: int
    financial_year: str
    income_source: str
    pan_last4: str
    cibil_signal: Optional[str] = None


class AadhaarAttestationAttrs(BaseModel):
    name_verified: bool
    address_verified: bool
    dob_year: int
    gender: str
    state: str


class LandOwnershipAttrs(BaseModel):
    parcel_id: str
    area_sqft: int
    district: str
    state: str
    ownership_type: str


class HealthRecordAttrs(BaseModel):
    health_id: str
    blood_group: str
    last_checkup_year: int
