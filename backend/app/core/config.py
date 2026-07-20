"""Application configuration loaded from environment / .env (pydantic-settings)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=False
    )

    # Core
    app_name: str = "Omnilinks"
    environment: str = "development"
    debug: bool = True

    # Database (async SQLAlchemy)
    database_url: str = "postgresql+asyncpg://omilinks:omilinks@localhost:5432/omilinks"
    db_echo: bool = False

    # Redis (cache, blacklist, rate-limit, queue)
    redis_url: str = "redis://localhost:6379/0"
    permission_cache_ttl: int = 300  # 5 min, ch.13 §7.2

    # Qdrant (RAG vector store)
    qdrant_url: str = "http://localhost:6333"
    embedding_dim: int = 768

    # JWT — separate issuer/secret per plane (ch.13 §7.1)
    jwt_tenant_secret: str = "CHANGE_ME_tenant"
    jwt_platform_secret: str = "CHANGE_ME_platform"
    jwt_algorithm: str = "HS256"
    access_token_ttl: int = 3600  # seconds
    password_reset_ttl: int = 1800

    # Kafka (ingestion pipeline)
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_ingestion_topic: str = "omilinks.ingestion"
    kafka_consumer_group: str = "omilinks-backend"

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Billing (Paymob, BRD ch.09)
    paymob_api_key: str = ""
    paymob_base_url: str = "https://apps.paymob.com"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
