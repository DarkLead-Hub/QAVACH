"""
ML-KEM-768 (Kyber768) Key Encapsulation Mechanism.
Used by the QAVACH app to encrypt documents with AES-256-GCM.
"""
import oqs
import base64
from typing import Tuple

KEM_ALGORITHM = "ML-KEM-768"


def generate_kem_keypair() -> Tuple[bytes, bytes]:
    """Generate an ML-KEM-768 keypair. Returns (public_key, secret_key)."""
    with oqs.KeyEncapsulation(KEM_ALGORITHM) as kem:
        public_key = kem.generate_keypair()
        secret_key = kem.export_secret_key()
    return public_key, secret_key


def encapsulate(public_key_bytes: bytes) -> Tuple[bytes, bytes]:
    """
    Encapsulate a shared secret using the recipient's public key.
    Returns (ciphertext, shared_secret).
    The shared_secret is used as the AES-256-GCM key.
    """
    with oqs.KeyEncapsulation(KEM_ALGORITHM) as kem:
        ciphertext, shared_secret = kem.encap_secret(public_key_bytes)
    return ciphertext, shared_secret


def decapsulate(secret_key_bytes: bytes, ciphertext: bytes) -> bytes:
    """
    Decapsulate to recover the shared secret using the recipient's secret key.
    Returns the shared_secret (same as the one produced by encapsulate).
    """
    with oqs.KeyEncapsulation(KEM_ALGORITHM) as kem:
        kem.set_secret_key(secret_key_bytes)
        shared_secret = kem.decap_secret(ciphertext)
    return shared_secret


def encapsulate_b64(public_key_b64: str) -> dict:
    """Convenience wrapper using base64 strings."""
    pub_key = base64.b64decode(public_key_b64)
    ciphertext, shared_secret = encapsulate(pub_key)
    return {
        "ciphertext_b64": base64.b64encode(ciphertext).decode(),
        "shared_secret_b64": base64.b64encode(shared_secret).decode(),
    }


def decapsulate_b64(secret_key_b64: str, ciphertext_b64: str) -> dict:
    """Convenience wrapper using base64 strings."""
    secret_key = base64.b64decode(secret_key_b64)
    ciphertext = base64.b64decode(ciphertext_b64)
    shared_secret = decapsulate(secret_key, ciphertext)
    return {
        "shared_secret_b64": base64.b64encode(shared_secret).decode(),
    }
