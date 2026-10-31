import os
from datetime import timedelta


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "3600")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", "2592000"))
    )
    DATABASE_URL = os.getenv(
        "DATABASE_URL", "postgresql://eprocure:eprocure@localhost:5432/eprocure"
    )
    SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "/app/uploads")
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
    BABEL_DEFAULT_LOCALE = "en"
    BABEL_SUPPORTED_LOCALES = ["en", "ar", "fr"]

    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "100/minute")
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    RATELIMIT_HEADERS_ENABLED = True


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class ProductionConfig(BaseConfig):
    DEBUG = False
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "")
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "redis://redis:6379/0")


class TestingConfig(BaseConfig):
    TESTING = True
    DATABASE_URL = os.getenv(
        "TEST_DATABASE_URL", "postgresql://eprocure:eprocure@localhost:5432/eprocure_test"
    )
    SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    RATELIMIT_ENABLED = False


config_by_name: dict[str, type[BaseConfig]] = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
