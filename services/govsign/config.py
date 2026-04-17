import os
from dotenv import load_dotenv

# load_dotenv is removed to rely on shell/docker environment variables in production

GOVSIGN_HOST = os.getenv("GOVSIGN_HOST", "http://localhost:8000")
GOVSIGN_ADMIN_KEY = os.getenv("GOVSIGN_ADMIN_KEY", "dev-admin-key-change-in-prod")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
STORAGE_URL = os.getenv("STORAGE_URL", "http://localhost:9000")
STORAGE_KEY = os.getenv("STORAGE_KEY", "minioadmin")
STORAGE_SECRET = os.getenv("STORAGE_SECRET", "minioadmin")
STORAGE_BUCKET = os.getenv("STORAGE_BUCKET", "qavach-docs")
PORTAL_REGISTRATION_SECRET = os.getenv("PORTAL_REGISTRATION_SECRET", "portal-secret-change-in-prod")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///govsign.db")
