import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    ENVIRONMENT = os.getenv("APP_ENV", os.getenv("FLASK_ENV", "development"))
    SECRET_KEY = os.getenv("SECRET_KEY", "microlearn_dev_secret_key_change_in_prod")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "microlearn_dev_jwt_secret_key_change_in_prod")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_DAYS", 7)))
    ALLOW_IN_MEMORY_DB = os.getenv(
        "ALLOW_IN_MEMORY_DB", "true" if ENVIRONMENT == "development" else "false"
    ).lower() == "true"
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ]
    
    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/microlearn_ai")
    
    # OpenRouter
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")
    OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    OPENROUTER_FALLBACK_MODEL = os.getenv("OPENROUTER_FALLBACK_MODEL", "")
    OPENROUTER_TIMEOUT_SECONDS = int(os.getenv("OPENROUTER_TIMEOUT_SECONDS", 45))
    CODE_SANDBOX_IMAGE = os.getenv(
        "CODE_SANDBOX_IMAGE",
        "python:3.12.8-alpine3.21@sha256:ba13ef990f6e5d13014e9e8d04c02a8fdb0fe53d6dccf6e19147f316e6cc3a84",
    )
    CODE_TIMEOUT_SECONDS = int(os.getenv("CODE_TIMEOUT_SECONDS", 5))
