"""
Configuration management using environment variables
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # API Configuration
    API_TITLE: str = "Project Charon API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "Digital Estate Manager with AI Agent Execution"

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # CORS Configuration
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"

    # Browser Configuration
    BROWSER_HEADLESS: bool = True
    BROWSER_TIMEOUT: int = 30000  # 30 seconds

    # Security
    SECRET_KEY: Optional[str] = None

    # Blockchain Configuration
    RPC_URL: Optional[str] = None
    CHARON_SWITCH_ADDRESS: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()

