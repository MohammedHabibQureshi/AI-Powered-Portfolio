from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "AI Portfolio API"
    ENVIRONMENT: str = "development"

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://localhost:3000",
    ]

    # Database Configuration (SQLAlchemy direct connection)
    DATABASE_URL: str = ""  # e.g., postgresql://postgres:password@db.supabase.co:5432/postgres

    @property
    def async_database_url(self) -> str:
        """Converts standard postgresql URL to psycopg async format."""
        if not self.DATABASE_URL:
            return "sqlite+aiosqlite:///:memory:"
        if self.DATABASE_URL.startswith("postgresql://"):
            return self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
        return self.DATABASE_URL

    # Supabase configurations
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # GitHub configuration
    GITHUB_ACCESS_TOKEN: str = ""
    GITHUB_USERNAME: str = "MohammedHabibQureshi"

    # Knowledge configuration (single source of truth under data/)
    KNOWLEDGE_DATA_DIR: str = ""  # empty -> resolves to <repo_root>/data
    KNOWLEDGE_WATCH_ENABLED: bool = True
    KNOWLEDGE_WATCH_INTERVAL_SECONDS: int = 5

    # Domain classification configuration
    CLASSIFIER_CONFIDENCE_THRESHOLD: float = 0.6
    AMBIGUOUS_CONFIDENCE_THRESHOLD: float = 0.4

    # AI Config
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""


settings = Settings()
