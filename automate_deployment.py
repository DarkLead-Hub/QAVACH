import os
import httpx
import asyncio
from dotenv import load_dotenv

# Load root .env
load_dotenv(".env")
GOVSIGN_HOST = os.getenv("GOVSIGN_HOST", "http://localhost:8000")
ADMIN_KEY = os.getenv("GOVSIGN_ADMIN_KEY", "dev-admin-key-change-in-prod")
MOCK_CA_HOST = os.getenv("MOCK_CA_HOST", "http://localhost:8001")

DEPARTMENTS_TO_REGISTER = [
    {
        "dept_id": "ITD", "name": "Income Tax Department", "algorithm": "SPHINCS+-SHAKE-128s-simple",
        "usage_description": "Credential signing, doc encryption", "quantum_status": "pqc",
        "portal_dir": "scholarship"
    },
    {
        "dept_id": "MCA", "name": "Ministry of Corporate Affairs", "algorithm": "ML-DSA-44",
        "usage_description": "Director KYC, ROC filings", "quantum_status": "hybrid",
        "portal_dir": "homeloan"
    },
    {
        "dept_id": "REVENUE", "name": "Revenue Dept (State)", "algorithm": "RSA-2048",
        "usage_description": "Land record signatures", "quantum_status": "classical",
        "portal_dir": "land-mutation"
    },
    {
        "dept_id": "UIDAI", "name": "UIDAI / Aadhaar", "algorithm": "ML-DSA-44",
        "usage_description": "eKYC attestation", "quantum_status": "pqc",
        "portal_dir": "ration-card"
    },
    {
        "dept_id": "MUNICIPAL", "name": "Municipal Corporation", "algorithm": "ECDSA-P256",
        "usage_description": "Trade licence issuance", "quantum_status": "classical",
        "portal_dir": "trade-licence"
    }
]

def update_env_local(portal_dir, new_key):
    env_path = os.path.join("portals", portal_dir, ".env.local")
    if not os.path.exists(env_path):
        print(f"[SKIP] {env_path} not found")
        return

    with open(env_path, "r") as f:
        lines = f.readlines()

    with open(env_path, "w") as f:
        for line in lines:
            if line.startswith("PORTAL_API_KEY="):
                f.write(f"PORTAL_API_KEY={new_key}\n")
            elif line.startswith("GOVSIGN_URL="):
                f.write(f"GOVSIGN_URL={GOVSIGN_HOST}\n")
            else:
                f.write(line)
    print(f"[SUCCESS] Updated {portal_dir}/.env.local with new key -> {new_key}")

async def main():
    print(f"Connecting to GovSign at {GOVSIGN_HOST}...")
    async with httpx.AsyncClient() as client:
        # Register each department
        for dept in DEPARTMENTS_TO_REGISTER:
            payload = {
                "dept_id": dept["dept_id"],
                "name": dept["name"],
                "algorithm": dept["algorithm"],
                "usage_description": dept["usage_description"],
                "quantum_status": dept["quantum_status"]
            }
            try:
                resp = await client.post(
                    f"{GOVSIGN_HOST}/departments",
                    json=payload,
                    headers={"X-API-Key": ADMIN_KEY}
                )
                
                if resp.status_code == 201:
                    data = resp.json()
                    new_key = data["api_key"]
                    print(f"[*] Registered {dept['dept_id']} -> Key: {new_key}")
                    # Update the relevant portal
                    update_env_local(dept["portal_dir"], new_key)
                elif resp.status_code == 409:
                    print(f"[!] {dept['dept_id']} already exists. Please clear backend DB to regenerate secure keys.")
                else:
                    print(f"[ERROR] Failed to register {dept['dept_id']}: {resp.text}")
                    
            except Exception as e:
                print(f"[ERROR] Connection failed for {dept['dept_id']}: {str(e)}")
                
        print("\n--- TRIGGERING MOCK-CA CREDENTIAL SEEDING ---")
        for citizen_id in ["CITIZEN_001", "CITIZEN_002", "CITIZEN_003"]:
            try:
                resp = await client.post(
                    f"{MOCK_CA_HOST}/credentials/issue",
                    json={"citizen_id": citizen_id}
                )
                print(f"Seeding {citizen_id}... Status: {resp.status_code}")
            except Exception as e:
                print(f"[ERROR] MockCA seeding failed for {citizen_id}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
