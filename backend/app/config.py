import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "StockSense API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "stocksense_secret_jwt_key_hackathon_demo_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./stocksense.db")

    class Config:
        env_file = ".env"

settings = Settings()
