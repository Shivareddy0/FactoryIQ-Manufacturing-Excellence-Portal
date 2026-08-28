from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "FactoryIQ – Manufacturing Excellence Portal"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super_secret_key_factory_iq_9876543210_abc"  # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = "sqlite:///./factoryiq.db"

    class Config:
        case_sensitive = True

settings = Settings()
