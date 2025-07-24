"""
Configuration settings for Child Growth Monitor Backend.
Handles different environments and sensitive configuration management.
"""

import os
from datetime import timedelta
from typing import Type


class Config:
    """Base configuration class with common settings."""

    # Basic Flask configuration
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-secret-key-change-in-production"

    # Database configuration
    DATABASE_URL = (
        os.environ.get("DATABASE_URL") or "sqlite:///cgm_development.db"
    )
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # SQLite doesn't need pool settings
    SQLALCHEMY_ENGINE_OPTIONS = {} if DATABASE_URL.startswith('sqlite') else {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_ALGORITHM = "HS256"

    # Azure Configuration
    AZURE_TENANT_ID = os.environ.get("AZURE_TENANT_ID")
    AZURE_CLIENT_ID = os.environ.get("AZURE_CLIENT_ID")
    AZURE_CLIENT_SECRET = os.environ.get("AZURE_CLIENT_SECRET")
    AZURE_STORAGE_ACCOUNT_NAME = os.environ.get("AZURE_STORAGE_ACCOUNT_NAME")
    AZURE_STORAGE_ACCOUNT_KEY = os.environ.get("AZURE_STORAGE_ACCOUNT_KEY")
    AZURE_STORAGE_CONTAINER_SCANS = "scan-data"
    AZURE_STORAGE_CONTAINER_IMAGES = "scan-images"

    # Machine Learning Service
    ML_SERVICE_URL = os.environ.get("ML_SERVICE_URL") or "http://localhost:8000"
    ML_SERVICE_API_KEY = os.environ.get("ML_SERVICE_API_KEY")

    # File upload settings
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max file size
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER") or "/tmp/uploads"
    ALLOWED_VIDEO_EXTENSIONS = {"mp4", "mov", "avi"}
    ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png"}

    # Security settings
    BCRYPT_LOG_ROUNDS = 12
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None

    # Privacy and compliance
    DATA_RETENTION_DAYS = 2555  # 7 years for medical data
    CONSENT_EXPIRY_DAYS = 365
    ANONYMIZATION_ENABLED = True

    # Monitoring and logging
    SENTRY_DSN = os.environ.get("SENTRY_DSN")
    LOG_LEVEL = os.environ.get("LOG_LEVEL") or "INFO"

    # Rate limiting
    RATELIMIT_STORAGE_URL = os.environ.get("REDIS_URL") or "redis://localhost:6379"

    # Email configuration (for notifications)
    MAIL_SERVER = os.environ.get("MAIL_SERVER")
    MAIL_PORT = int(os.environ.get("MAIL_PORT") or 587)
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "true").lower() in ["true", "on", "1"]
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")

    # Child data protection settings
    REQUIRE_PARENTAL_CONSENT = True
    ENCRYPT_CHILD_DATA = True
    AUTO_ANONYMIZE_AFTER_DAYS = 30

    @staticmethod
    def init_app(app):
        """Initialize application with configuration."""
        pass


class DevelopmentConfig(Config):
    """Development environment configuration."""

    DEBUG = True
    ENV = "development"
    TESTING = False

    # More verbose logging in development
    LOG_LEVEL = "DEBUG"

    # Relaxed security for development
    BCRYPT_LOG_ROUNDS = 4  # Faster hashing for development

    # Development database
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get("DEV_DATABASE_URL")
        or "sqlite:///cgm_development.db"
    )


class TestingConfig(Config):
    """Testing environment configuration."""

    DEBUG = True
    ENV = "testing"
    TESTING = True

    # In-memory database for testing
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"

    # Disable CSRF for testing
    WTF_CSRF_ENABLED = False

    # Fast hashing for tests
    BCRYPT_LOG_ROUNDS = 4

    # Test-specific settings
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    CONSENT_EXPIRY_DAYS = 1  # Short expiry for testing

    # Disable external services in testing
    SENTRY_DSN = None
    ML_SERVICE_URL = "http://mock-ml-service"


class ProductionConfig(Config):
    """Production environment configuration."""

    DEBUG = False
    ENV = "production"
    TESTING = False

    # Production security
    BCRYPT_LOG_ROUNDS = 14

    # Ensure required environment variables
    @classmethod
    def init_app(cls, app):
        Config.init_app(app)

        # Ensure critical environment variables are set
        required_vars = [
            "SECRET_KEY",
            "DATABASE_URL",
            "AZURE_TENANT_ID",
            "AZURE_CLIENT_ID",
            "AZURE_CLIENT_SECRET",
        ]

        for var in required_vars:
            if not os.environ.get(var):
                raise RuntimeError(f"Required environment variable {var} is not set")


class StagingConfig(ProductionConfig):
    """Staging environment configuration."""

    ENV = "staging"
    DEBUG = False

    # Staging-specific database
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get("STAGING_DATABASE_URL") or Config.SQLALCHEMY_DATABASE_URI
    )


# Configuration mapping
config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "staging": StagingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}


def get_config(config_name: str = "default") -> Type[Config]:
    """Get configuration class by name."""
    return config.get(config_name, config["default"])
