"""
PQC Crypto Sidecar — lightweight FastAPI service for Flutter app.
Exposes liboqs operations over HTTP so the Flutter app doesn't need FFI.
Runs on port 8002.
"""
import base64
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Import crypto modules from the govsign package
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from crypto.signer import generate_keypair, sign_payload, verify_signature, get_nist_name
from crypto.kem import generate_kem_keypair, encapsulate_b64, decapsulate_b64

app = FastAPI(
    title="QAVACH PQC Sidecar",
    version="1.0.0",
    description="PQC crypto operations for Flutter app — ML-DSA-44 & ML-KEM-768",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Signing ──────────────────────────────────────────


class KeygenRequest(BaseModel):
    algorithm: str = "ML-DSA-44"


class SignRequest(BaseModel):
    algorithm: str = "ML-DSA-44"
    private_key_b64: str
    payload: str  # base64-encoded payload bytes


class VerifyRequest(BaseModel):
    algorithm: str = "ML-DSA-44"
    public_key_b64: str
    payload: str  # base64-encoded payload bytes
    signature_b64: str


@app.post("/sidecar/keygen")
async def keygen(body: KeygenRequest):
    """Generate a PQC keypair for the citizen."""
    pub_key, priv_key = generate_keypair(body.algorithm)
    return {
        "algorithm": get_nist_name(body.algorithm),
        "public_key_b64": base64.b64encode(pub_key).decode(),
        "private_key_b64": base64.b64encode(priv_key).decode(),
    }


@app.post("/sidecar/sign")
async def sign(body: SignRequest):
    """Sign a payload with the citizen's private key."""
    priv_key = base64.b64decode(body.private_key_b64)
    payload = base64.b64decode(body.payload)
    signature = sign_payload(body.algorithm, priv_key, payload)
    return {
        "algorithm": get_nist_name(body.algorithm),
        "signature_b64": base64.b64encode(signature).decode(),
    }


@app.post("/sidecar/verify")
async def verify(body: VerifyRequest):
    """Verify a signature."""
    pub_key = base64.b64decode(body.public_key_b64)
    payload = base64.b64decode(body.payload)
    signature = base64.b64decode(body.signature_b64)
    valid = verify_signature(body.algorithm, pub_key, payload, signature)
    return {
        "valid": valid,
        "algorithm": get_nist_name(body.algorithm),
    }


# ── KEM (Key Encapsulation) ─────────────────────────


class KemKeygenRequest(BaseModel):
    pass  # no params needed


class KemWrapRequest(BaseModel):
    public_key_b64: str


class KemUnwrapRequest(BaseModel):
    secret_key_b64: str
    ciphertext_b64: str


@app.post("/sidecar/kem/keygen")
async def kem_keygen(body: KemKeygenRequest = KemKeygenRequest()):
    """Generate an ML-KEM-768 keypair for document encryption."""
    pub_key, secret_key = generate_kem_keypair()
    return {
        "algorithm": "ML-KEM-768",
        "public_key_b64": base64.b64encode(pub_key).decode(),
        "secret_key_b64": base64.b64encode(secret_key).decode(),
    }


@app.post("/sidecar/kem/wrap")
async def kem_wrap(body: KemWrapRequest):
    """Encapsulate a shared secret using the recipient's public key."""
    result = encapsulate_b64(body.public_key_b64)
    return {
        "algorithm": "ML-KEM-768",
        **result,
    }


@app.post("/sidecar/kem/unwrap")
async def kem_unwrap(body: KemUnwrapRequest):
    """Decapsulate to recover the shared secret."""
    result = decapsulate_b64(body.secret_key_b64, body.ciphertext_b64)
    return {
        "algorithm": "ML-KEM-768",
        **result,
    }


@app.get("/health")
def health():
    """Health check."""
    try:
        import oqs
        ver = oqs.oqs_version()
    except Exception as e:
        ver = f"error: {e}"
    return {"status": "ok", "service": "pqc-sidecar", "liboqs_version": ver}
