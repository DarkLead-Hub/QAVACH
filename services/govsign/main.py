"""
QAVACH GovSign API — PQC Government Signing Service
Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.models import Base
from config import DATABASE_URL

# Database setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(engine)

# FastAPI app
app = FastAPI(
    title="GovSign API",
    version="1.0.0",
    description="PQC Government Signing Service — NIST FIPS 203/204/205 compliant",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and register routers
from routers import sign, keys, departments, sessions, cbom

app.include_router(sign.router, prefix="/sign", tags=["signing"])
app.include_router(keys.router, prefix="/pubkeys", tags=["keys"])
app.include_router(departments.router, prefix="/departments", tags=["departments"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(cbom.router, prefix="/cbom", tags=["cbom"])


@app.get("/health")
def health():
    """Health check — returns liboqs version."""
    try:
        import oqs
        ver = oqs.oqs_version()
    except Exception as e:
        ver = f"error: {e}"
    return {"status": "ok", "liboqs_version": ver}
