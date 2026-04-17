# QAVACH: Deployment & Replication Guide

This guide provides step-by-step instructions for replicating the QAVACH e-governance platform on a local machine or a cloud instance (e.g., AWS EC2).

---

## 🌐 Live Backend Services (AWS EC2)

The core QAVACH cryptographic and issuance services are live on the internet to support mobile and local portal operations. **Note:** The web portals and CBOM Dashboard are intended to be run locally in this demo environment.

**Public IP:** `13.126.194.20`

| Service | Port | Endpoint / Health | Status |
| :--- | :--- | :--- | :--- |
| **GovSign API** | `8000` | [http://13.126.194.20:8000/health](http://13.126.194.20:8000/health) | ✅ LIVE |
| **Mock Issuer CA** | `8001` | [http://13.126.194.20:8001/health](http://13.126.194.20:8001/health) | ✅ LIVE |
| **PQC Sidecar** | `8002` | [http://13.126.194.20:8002/health](http://13.126.194.20:8002/health) | ✅ LIVE |

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
cp .env.example .env  # Update values as needed
```

Start the baseline infrastructure (Redis, MinIO):
```bash
docker compose up -d
```

---

## 🔐 Step 2: Backend Services (GovSign & Mock CA)

### GovSign API
```bash
cd services/govsign
pip install -r requirements.txt
python seeds/seed_departments.py  # Critical: Populates the PQC registry
uvicorn main:app --reload --port 8000
```

### Mock Issuer CA
```bash
cd ../mock-ca
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
# Issue credentials for demo citizens
curl -X POST http://localhost:8001/credentials/issue -d '{"citizen_id": "CITIZEN_001"}'
```

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
