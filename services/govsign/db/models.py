from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer
from sqlalchemy.orm import declarative_base
import enum
import datetime

Base = declarative_base()


class AlgorithmType(enum.Enum):
    ML_DSA_44 = "ML-DSA-44"
    ML_DSA_65 = "ML-DSA-65"
    SLH_DSA_128S = "SLH-DSA-SHAKE-128s"
    RSA_2048 = "RSA-2048"
    ECDSA_P256 = "ECDSA-P256"
    ECDSA_P384 = "ECDSA-P384"


class QuantumStatus(enum.Enum):
    PQC = "pqc"
    HYBRID = "hybrid"
    CLASSICAL = "classical"
    PENDING = "pending"


class Department(Base):
    __tablename__ = "departments"
    dept_id = Column(String, primary_key=True)      # e.g. "ITD", "UIDAI"
    name = Column(String, nullable=False)
    algorithm = Column(String, nullable=False)       # AlgorithmType value
    usage_description = Column(String)
    quantum_status = Column(String, default=QuantumStatus.PENDING.value)
    api_key = Column(String, nullable=False)         # plaintext for dev, hashed in prod
    public_key_b64 = Column(Text)                    # base64-encoded public key
    private_key_path = Column(String)                # path to private key file
    registered_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)


class CbomEntry(Base):
    __tablename__ = "cbom_entries"
    id = Column(String, primary_key=True)            # uuid
    dept_id = Column(String, nullable=False)
    algorithm = Column(String, nullable=False)
    doc_type = Column(String)                        # e.g. "income_certificate"
    operation = Column(String)                       # "sign" or "verify"
    quantum_safe = Column(Boolean)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class PgcaSession(Base):
    __tablename__ = "pgca_sessions"
    session_id = Column(String, primary_key=True)    # uuid
    nonce = Column(String, nullable=False)           # 32-byte hex
    claim_type = Column(String, nullable=False)      # e.g. "income_lt_3L"
    portal_id = Column(String, nullable=False)
    status = Column(String, default="pending")       # pending | verified | denied | expired
    proof_payload = Column(Text)                     # JSON, populated after verification
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime)
