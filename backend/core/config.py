"""
Configuration management using environment variables
"""

from pydantic_settings import BaseSettings
from typing import Optional, Union
from pydantic import field_validator, model_validator


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

    # CORS Configuration - can be string (comma-separated) or list
    ALLOWED_ORIGINS: Union[str, list[str]] = "http://localhost:3000,http://localhost:8000"
    
    @model_validator(mode="after")
    def parse_allowed_origins(self):
        """Parse comma-separated string into list"""
        if isinstance(self.ALLOWED_ORIGINS, str):
            self.ALLOWED_ORIGINS = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        return self

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

    # Celery Configuration
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"


    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()

