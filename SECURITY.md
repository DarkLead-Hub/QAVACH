# QAVACH: Security Architecture & Audit Report

This document details the security posture, threat mitigation strategies, and architectural decisions of the QAVACH platform.

---

## 🛡️ Security Philosophy

QAVACH is built on the principle of **Defense in Depth** and **Zero Trust**. We assume the network is hostile and that central databases are primary targets. Our architecture shifts the trust boundary from the server to the **citizen's secure enclave**.

---

## 🔐 Cryptographic Standards (NIST Compliance)

We have implemented the NIST Post-Quantum Cryptography (PQC) standards to ensure long-term resilience against quantum computer-aided cryptanalysis.

| Category | Standard | Implementation | Benefit |
| :--- | :--- | :--- | :--- |
| **Signature** | NIST FIPS 204 | **ML-DSA** (Dilithium) | Lattice-based security. High performance. |
| **Hash-based Sign** | NIST FIPS 205 | **SLH-DSA** (SPHINCS+) | Stateless. Robust against mathematical breakthroughs. |
| **Encryption (KEM)** | NIST FIPS 203 | **ML-KEM** (Kyber) | Secure key encapsulation for document storage. |

---

## 🏗️ Core Security Mechanisms

### 1. Selective Disclosure (PGCA)
Traditional verification requires sharing an entire document (e.g., a 3-page Income Tax Return). QAVACH uses **Policy-Gated Credential Attestation (PGCA)**:
- **The Problem:** Document sharing leads to identity theft and data oversharing.
- **The QAVACH Solution:** The verifier sends a machine-readable policy (OPA Rego). The user's phone evaluates the policy against the local document and only signs a **Boolean Attestation** ("Yes, I earn less than 3L").

### 2. Zero-Trust Storage
Documents are stored in a "Locked and Encrypted" state:
- **Key Hierarchy:** A unique AES-256-GCM key is generated for every document.
- **PQC Wrap:** This AES key is encapsulated via **ML-KEM-768** using the citizen's public key.
- **Result:** Even if the storage provider (MinIO/S3) is breached, the data is useless without the citizen's hardware-bound private key.

### 3. CBOM (Cryptography Bill of Materials)
QAVACH addresses the "Shadow Crypto" problem.
- **Live Inventory:** Every cryptographic operation across the state is inventoried.
- **Migration Tracking:** The system exposes which departments are using vulnerable classical algorithms (RSA/ECC) vs. resilient PQC algorithms.

---

## ⚔️ Threat Mitigation (OWASP & E-Gov Specific)

| Threat | QAVACH Mitigation |
| :--- | :--- |
| **Man-in-the-Middle (MitM)** | All communications over TLS. Signed QR challenges ensure portal authenticity. |
| **SQL Injection** | Parameterized queries via SQLAlchemy. Minimal reliance on relational DBs for core logic. |
| **Credential Forgery** | Lattice-based PQC signatures (ML-DSA) are virtually impossible to forge without the private key. |
| **Data Breach** | Decentralized architecture. There is no central "Citizen Database" to breach. |
| **Quantum Harvest** | All long-term signatures and KEMs are post-quantum by design. |

---

## 📉 Disaster Recovery & Resilience

### Service Availability
- **Decentralized Execution:** If the GovSign API goes down, citizens still have their documents. Offline verification is possible via pre-calculated proofs.
- **Stateless Signatures:** SLH-DSA allows for signature verification without needing to maintain complex state, simplifying recovery.

### Self-Healing Infrastructure
Our deployment uses **Docker Containerization**, allowing for rapid restarts and scaling. The Use of **Redis** for session management ensures that portal verification states are persistent across service restarts.

---

## 📝 Security Audit Summary

- **Authentication:** API-Key based for internal services; Multi-factor (Mock Aadhaar) for citizens.
- **Encryption:** AES-256 for symmetric data; ML-KEM-768 for asymmetric wrapping.
- **Integrity:** SHA3-256 used for all document hashing.
- **Anonymity:** Selective disclosure ensures that the verifier only learns what they *need* to know, preserving citizen privacy.

---
© 2024 QAVACH Security Team | Defense for the Quantum Era
