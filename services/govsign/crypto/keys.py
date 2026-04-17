"""
Key generation, storage, and retrieval for PQC and classical algorithms.
"""
import os
import base64
import hashlib
from pathlib import Path
from .signer import generate_keypair, is_quantum_safe

# Use /app/keys inside Docker, or local keys dir for development
if os.path.exists("/app"):
    KEYS_DIR = Path("/app/keys")
else:
    KEYS_DIR = Path(os.path.join(os.path.dirname(__file__), '..', 'keys'))

KEYS_DIR.mkdir(exist_ok=True)


def store_keypair(dept_id: str, algorithm: str) -> tuple:
    """
    Generates and stores a keypair. Returns (pub_key_b64, priv_key_path).
    For PQC algorithms, uses liboqs. For classical, generates mock keys.
    """
    if is_quantum_safe(algorithm):
        pub_key, priv_key = generate_keypair(algorithm)
    else:
        # Classical algorithms — generate deterministic mock keys for demo
        pub_key, priv_key = _generate_classical_mock_keys(dept_id, algorithm)

    priv_path = KEYS_DIR / f"{dept_id}.priv"
    priv_path.write_bytes(priv_key)
    priv_path.chmod(0o600)

    pub_path = KEYS_DIR / f"{dept_id}.pub"
    pub_path.write_bytes(pub_key)

    pub_key_b64 = base64.b64encode(pub_key).decode()
    return pub_key_b64, str(priv_path)


def load_private_key(priv_key_path: str) -> bytes:
    """Load a private key from the filesystem."""
    return Path(priv_key_path).read_bytes()


def load_public_key_bytes(pub_key_b64: str) -> bytes:
    """Decode a base64-encoded public key."""
    return base64.b64decode(pub_key_b64)


def _generate_classical_mock_keys(dept_id: str, algorithm: str) -> tuple:
    """
    Generate deterministic mock keys for classical algorithms.
    These are NOT real RSA/ECDSA keys — they are placeholders for the demo
    so that the CBOM can track classical departments consistently.
    """
    seed = f"{dept_id}:{algorithm}:mock-key-seed".encode()
    pub_key = hashlib.sha3_256(seed + b":public").digest()
    priv_key = hashlib.sha3_256(seed + b":private").digest()
    return pub_key, priv_key
