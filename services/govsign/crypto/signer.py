"""
PQC Signing and Verification using liboqs.
Supports ML-DSA-44, ML-DSA-65, SLH-DSA-SHAKE-128s (PQC) and RSA/ECDSA (classical passthrough).
"""
import oqs
import base64
import hashlib
import json
import uuid
from typing import Tuple
from datetime import datetime, timezone

# Algorithm name constants — use these everywhere, never hardcode strings
ML_DSA_44 = "ML-DSA-44"       # FIPS 204 — fast interactive proofs
ML_DSA_65 = "ML-DSA-65"       # FIPS 204 — department credential signing
SLH_DSA = "SLH_DSA_PURE_SHAKE_128S"  # liboqs 0.15 name for SLH-DSA-SHAKE-128s (FIPS 205)

# liboqs internal name → NIST standardised name mapping
LIBOQS_TO_NIST = {
    "ML-DSA-44": "ML-DSA-44",
    "ML-DSA-65": "ML-DSA-65",
    "SLH_DSA_PURE_SHAKE_128S": "SLH-DSA-SHAKE-128s",
    "SLH_DSA_PURE_SHAKE_128F": "SLH-DSA-SHAKE-128f",
    # Legacy names (for backward compat with spec docs)
    "SPHINCS+-SHAKE-128s": "SLH-DSA-SHAKE-128s",
    "SPHINCS+-SHAKE-128s-simple": "SLH-DSA-SHAKE-128s",
    "SPHINCS+-SHAKE-128f": "SLH-DSA-SHAKE-128f",
}

# Classical algorithms that are NOT quantum-safe
CLASSICAL_ALGORITHMS = {"RSA-2048", "RSA-4096", "ECDSA-P256", "ECDSA-P384"}

# Map user-facing algorithm names to liboqs names
NIST_TO_LIBOQS = {
    "ML-DSA-44": "ML-DSA-44",
    "ML-DSA-65": "ML-DSA-65",
    "SLH-DSA-SHAKE-128s": "SLH_DSA_PURE_SHAKE_128S",
    "SLH_DSA_PURE_SHAKE_128S": "SLH_DSA_PURE_SHAKE_128S",
    # Accept legacy names from spec docs
    "SPHINCS+-SHAKE-128s": "SPHINCS+-SHAKE-128s-simple",
    "SPHINCS+-SHAKE-128s-simple": "SPHINCS+-SHAKE-128s-simple",
    "SLH-DSA-SHAKE-128s": "SPHINCS+-SHAKE-128s-simple",
    "SLH_DSA_PURE_SHAKE_128S": "SPHINCS+-SHAKE-128s-simple",
}


def is_quantum_safe(algorithm: str) -> bool:
    """Check if an algorithm is quantum-safe."""
    return algorithm not in CLASSICAL_ALGORITHMS


def get_liboqs_name(algorithm: str) -> str:
    """Convert user-facing algorithm name to liboqs-compatible name."""
    return NIST_TO_LIBOQS.get(algorithm, algorithm)


def get_nist_name(algorithm: str) -> str:
    """Convert liboqs algorithm name to NIST standardised name."""
    return LIBOQS_TO_NIST.get(algorithm, algorithm)


def generate_keypair(algorithm: str) -> Tuple[bytes, bytes]:
    """Returns (public_key_bytes, private_key_bytes) for PQC algorithms."""
    liboqs_name = get_liboqs_name(algorithm)
    with oqs.Signature(liboqs_name) as signer:
        public_key = signer.generate_keypair()
        private_key = signer.export_secret_key()
    return public_key, private_key


def sign_payload(algorithm: str, private_key_bytes: bytes, payload: bytes) -> bytes:
    """Signs arbitrary bytes with a PQC algorithm. Returns raw signature bytes."""
    liboqs_name = get_liboqs_name(algorithm)
    # liboqs 0.15+: pass secret_key via constructor (set_secret_key was removed)
    with oqs.Signature(liboqs_name, private_key_bytes) as signer:
        # Always hash the payload first — consistent with NIST guidance
        digest = hashlib.sha3_256(payload).digest()
        signature = signer.sign(digest)
    return signature


def verify_signature(algorithm: str, public_key_bytes: bytes, payload: bytes, signature: bytes) -> bool:
    """Returns True if signature is valid for payload under public_key."""
    try:
        liboqs_name = get_liboqs_name(algorithm)
        with oqs.Signature(liboqs_name) as verifier:
            digest = hashlib.sha3_256(payload).digest()
            return verifier.verify(digest, signature, public_key_bytes)
    except Exception:
        return False


def sign_document_hash(algorithm: str, private_key_bytes: bytes, doc_hash_hex: str,
                       dept_id: str, doc_type: str) -> dict:
    """
    High-level signing. Takes a document hash (hex), returns a structured signature envelope.
    This envelope is what gets embedded in PDFs / returned to departments.
    """
    nist_name = get_nist_name(algorithm)

    envelope_data = {
        "doc_hash": doc_hash_hex,
        "dept_id": dept_id,
        "doc_type": doc_type,
        "algorithm": nist_name,
        "signed_at": datetime.now(timezone.utc).isoformat(),
        "sig_id": str(uuid.uuid4()),
    }
    payload_bytes = json.dumps(envelope_data, sort_keys=True).encode()

    if is_quantum_safe(algorithm):
        signature_bytes = sign_payload(algorithm, private_key_bytes, payload_bytes)
    else:
        # Classical algorithms - generate a mock signature for demo
        signature_bytes = _classical_sign(algorithm, private_key_bytes, payload_bytes)

    return {
        **envelope_data,
        "signature_b64": base64.b64encode(signature_bytes).decode(),
        "quantum_safe": is_quantum_safe(algorithm),
    }


def _classical_sign(algorithm: str, private_key_bytes: bytes, payload: bytes) -> bytes:
    """
    Classical signing passthrough for RSA/ECDSA departments.
    For demo purposes, we use a deterministic hash-based mock signature.
    In production, this would use Python cryptography library with real RSA/ECDSA keys.
    """
    # For the hackathon demo: produce a deterministic mock signature
    # that is consistent and verifiable within our system
    combined = algorithm.encode() + private_key_bytes[:32] + payload
    mock_sig = hashlib.sha3_512(combined).digest()
    return mock_sig


def _classical_verify(algorithm: str, public_key_bytes: bytes, payload: bytes, signature: bytes) -> bool:
    """Verify a classical mock signature."""
    # For demo: reconstruct the mock signature and compare
    # In production, use Python cryptography library
    combined = algorithm.encode() + public_key_bytes[:32] + payload
    expected = hashlib.sha3_512(combined).digest()
    return signature == expected
