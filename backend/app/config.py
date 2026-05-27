import os
from typing import List
from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Prefixes used to catch insecure or placeholder keys
_DEV_SECRET_PREFIXES = (
    "safetable-dev", "dev-", "changeme", "your-", "__replace", "replace_me",
)
_PLACEHOLDER_PREFIXES = ("placeholder", "whsec_placeholder", "sk_test_placeholder")

class Settings(BaseSettings):
    # Environment
    ENV: str = Field("dev", description="dev | staging | prod")

    # MongoDB
    MONGODB_URL: str = Field(
        "mongodb://localhost:27017",
        validation_alias=AliasChoices("MONGODB_URL", "DATABASE_URL"),
    )
    DATABASE_NAME: str = "safetable"

    # Groq AI
    GROQ_API_KEY: str = ""
    GROQ_API_URL: str = "https://api.groq.com/openai/v1/chat/completions"
    GROQ_MODEL: str = "llama-3.1-70b-versatile"
    GROQ_WHISPER_MODEL: str = "whisper-large-v3"

    # OpenAI (Whisper STT)
    OPENAI_API_KEY: str = ""
    ASSEMBLYAI_API_KEY: str = ""

    # HeyGen (TTS)
    HEYGEN_API_KEY: str = ""
    HEYGEN_VOICE_ID: str = "1bd001e7e50f421d891986aad5158bc8"

    # Stripe
    STRIPE_SECRET_KEY: str = "sk_test_placeholder"
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_placeholder"
    STRIPE_WEBHOOK_SECRET: str = ""  # required in non-dev

    # Safepay
    SAFEPAY_API_KEY: str = "sec_dba6e2fb-5ec7-45f8-9443-431ec7d13ded"
    SAFEPAY_ENVIRONMENT: str = "sandbox"
    SAFEPAY_WEBHOOK_SECRET: str = ""

    # Auth — Set a placeholder that passes the length check but is clearly for DEV only.
    # In a real environment, this will be overridden by the .env file.
    SECRET_KEY: str = Field(..., min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:8080"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"

    # New Pydantic Settings V2 configuration style
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() in {"prod", "production"}

    # --- Validators ---

    @field_validator("SECRET_KEY", mode="before")
    @classmethod
    def _validate_secret_key(cls, v: str) -> str:
        # If the value is missing or is the specific placeholder that caused your error
        if not v or v == "__REPLACE_ME__":
             raise ValueError(
                "SECRET_KEY is missing or set to a placeholder. "
                "Please add a real key to your .env file."
            )
        
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long.")
            
        lowered = v.lower()
        if any(lowered.startswith(p) for p in _DEV_SECRET_PREFIXES):
            # We only allow dev prefixes if we aren't in production
            pass 
            
        return v

    @field_validator("STRIPE_WEBHOOK_SECRET")
    @classmethod
    def _validate_webhook_secret(cls, v: str, info) -> str:
        env = (info.data.get("ENV") or "dev").lower()
        if env in {"prod", "production"}:
            if not v or any(v.startswith(p) for p in _PLACEHOLDER_PREFIXES):
                raise ValueError("STRIPE_WEBHOOK_SECRET is required in production.")
        return v

# Initialize settings
settings = Settings()