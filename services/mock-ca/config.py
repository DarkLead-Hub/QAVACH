import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

GOVSIGN_HOST = os.getenv("GOVSIGN_HOST", "http://localhost:8000")
MOCK_CA_HOST = os.getenv("MOCK_CA_HOST", "http://localhost:8001")

# Department API keys (must match seed_departments.py values)
ITD_API_KEY = "govsign-itd-dev"
UIDAI_API_KEY = "govsign-uidai-dev"
REVENUE_API_KEY = "govsign-revenue-dev"
STATE_HEALTH_API_KEY = "govsign-state_health-dev"
