# QAVACH: Deployment & Replication Guide

This guide provides step-by-step instructions for replicating the QAVACH e-governance platform on a local machine or a cloud instance (e.g., AWS EC2).

---

## 🌐 Live Backend Services (AWS EC2)

The core QAVACH cryptographic and issuance services are live on the internet to support mobile and local portal operations. **Note:** The web portals and CBOM Dashboard are intended to be run locally in this demo environment.

**Public IP:** `13.126.194.20`

| Service | Port | Endpoint / Health | Status |
| :--- | :--- | :--- | :--- |
| **GovSign API** | `8000` | [http://13.203.215.126:8000/health](http://13.203.215.126:8000/health) | ✅ LIVE |
| **Mock Issuer CA** | `8001` | [http://13.203.215.126:8001/health](http://13.203.215.126:8001/health) | ✅ LIVE |
| **PQC Sidecar** | `8002` | [http://13.203.215.126:8002/health](http://13.203.215.126:8002/health) | ✅ LIVE |

---

## 🛠️ Prerequisites

Ensure the following are installed:
- **Docker & Docker Compose**
- **Python 3.11+**
- **Flutter SDK 3.19+** (for the mobile app)
- **Node.js 18+** (for the dashboard and portals)
- **liboqs** (C library for post-quantum cryptography)

### Installing liboqs (System-wide)
```bash
sudo apt-get update
sudo apt-get install -y cmake ninja-build libssl-dev python3-dev
git clone --depth 1 https://github.com/open-quantum-safe/liboqs.git
cd liboqs && mkdir build && cd build
cmake -GNinja .. -DBUILD_SHARED_LIBS=ON
ninja && sudo ninja install
sudo ldconfig
```

---

## 🏗️ Step 1: Infrastructure Setup

Clone the repository and create the environment file:
```bash
git clone <repository-url>
cd QAVACH
```

### The Root `.env` Schema
You must create a `.env` file in the root directory before running Docker. This configures the global host IPs:

```dotenv
# .env
# GovSign API
GOVSIGN_HOST=http://[IP-ADRESS]:8000
GOVSIGN_ADMIN_KEY=dev-admin-key-change-in-prod

# Mock Issuer CA
MOCK_CA_HOST=http://[IP-ADRESS]:8001

# Session store (Redis)
REDIS_URL=redis://localhost:6379

# Cloud document store (local MinIO for dev)
STORAGE_URL=http://localhost:9000
STORAGE_KEY=minioadmin
STORAGE_SECRET=minioadmin
STORAGE_BUCKET=qavach-docs

# Flutter app (these go in lib/config.dart)
FLUTTER_GOVSIGN_URL=http://[IP-ADRESS]:8000
FLUTTER_MOCK_CA_URL=http://[IP-ADRESS]:8001

# Portal shared secret (portals register with GovSign using this)
PORTAL_REGISTRATION_SECRET=portal-secret-change-in-prod
```

Start the baseline infrastructure (Redis, MinIO, GovSign, Sidecar, Mock-Ca):
```bash
docker compose up --build -d
```

---

## 🔐 Step 2: Automated Key Generation & Environment Injection

Because GovSign generates secure, randomized API keys for every department (e.g., `govsign-itd-6f31918999...`), the old deterministic script (`seed_departments.py`) is insufficient. 

To safely register the departments to your remote database, link GovSign to Mock CA, and automatically inject the final securely-generated API keys into all of your Local Portals (`portals/*/.env.local`), run the automated deployment script provided in the root directory:

```bash
# Ensure you are at the QAVACH root folder
python automate_deployment.py
```

*This script will ping the APIs listed in your `.env`, register the 5 core simulated government departments, trigger MockCA to locally issue sandbox credentials for all 3 demo citizens, and gracefully update your portal configuration files.*

---

## 📊 Step 3: CBOM Dashboard

```bash
cd ../../dashboard
npm install
npm run dev
# Dashboard is live at http://localhost:5173
```

---

## 📱 Step 4: QAVACH Flutter App

### PQC Sidecar (required for mobile crypto)
In a separate terminal:
```bash
cd services/govsign
uvicorn sidecar:app --reload --port 8002
```

### Build the App
```bash
cd ../../qavach_app
flutter pub get
flutter run -d android
```

---

## 🌐 Step 5: Verifier Portals

Each portal runs on a specific port to simulate independent services.

| Portal | Command | URL |
| :--- | :--- | :--- |
| **Scholarship** | `cd portals/scholarship && npm run dev -- -p 3001` | http://localhost:3001 |
| **Home Loan** | `cd portals/homeloan && npm run dev -- -p 3002` | http://localhost:3002 |
| **Land Mutation** | `cd portals/land-mutation && npm run dev -- -p 3003` | http://localhost:3003 |
| **Ration Card** | `cd portals/ration-card && npm run dev -- -p 3004` | http://localhost:3004 |
| **Trade Licence** | `cd portals/trade-licence && npm run dev -- -p 3005` | http://localhost:3005 |

---

## 🧪 Testing the End-to-End Flow

1. **Onboarding:** Open the QAVACH app, use Aadhaar `111122223333`. Witness PQC key generation.
2. **Scanning (PQC):** Go to the Scholarship Portal. Scan the QR. The app will perform an on-device policy check and generate a proof.
3. **Verification:** The portal will display "Verified - PQC Safe."
4. **Audit:** Open the CBOM dashboard (5173). Witness the real-time log entry for the ITD department.
5. **Legacy Contrast:** Try the Ration Card portal. Observe the "Classical Risk" warning and the manual document upload requirement.

---
© 2026 QAVACH Deployment Team
