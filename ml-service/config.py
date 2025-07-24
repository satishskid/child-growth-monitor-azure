"""
Configuration settings for Child Growth Monitor ML Service
"""

import os
from functools import lru_cache
from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application settings
    app_name: str = "Child Growth Monitor ML Service"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # API settings
    api_host: str = "0.0.0.0"
    api_port: int = 8001
    cors_origins: list = ["*"]
    
    # ML Model settings
    model_path: str = "models/"
    max_video_size_mb: int = 100
    max_processing_time_seconds: int = 300
    
    # MediaPipe settings
    pose_detection_confidence: float = 0.5
    pose_tracking_confidence: float = 0.5
    pose_model_complexity: int = 2
    
    # Video processing settings
    target_fps: int = 10
    max_frames_per_video: int = 100
    min_frame_quality: float = 0.3
    
    # Measurement settings
    default_pixel_to_cm_ratio: float = 0.1
    measurement_confidence_threshold: float = 0.5
    
    # WHO standards settings
    who_standards_path: str = "data/who_standards/"
    
    # Logging settings
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Security settings
    max_concurrent_requests: int = 10
    request_timeout_seconds: int = 60
    
    # Storage settings
    temp_storage_path: str = "/tmp/cgm_ml_service"
    cleanup_temp_files: bool = True
    
    # Database settings (if needed for caching)
    redis_url: str = None
    cache_ttl_seconds: int = 3600
    
    class Config:
        env_file = ".env"
        env_prefix = "CGM_ML_"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Development settings
class DevelopmentSettings(Settings):
    """Development-specific settings."""
    debug: bool = True
    log_level: str = "DEBUG"
    cors_origins: list = ["http://localhost:3000", "http://localhost:8080", "http://localhost:19006"]


# Production settings
class ProductionSettings(Settings):
    """Production-specific settings."""
    debug: bool = False
    log_level: str = "INFO"
    cors_origins: list = []  # Should be set from environment
    max_concurrent_requests: int = 50


# Testing settings
class TestingSettings(Settings):
    """Testing-specific settings."""
    debug: bool = True
    log_level: str = "DEBUG"
    temp_storage_path: str = "/tmp/cgm_ml_service_test"


def get_settings_for_environment(environment: str = None) -> Settings:
    """Get settings for specific environment."""
    if environment is None:
        environment = os.getenv("ENVIRONMENT", "development")
    
    if environment == "production":
        return ProductionSettings()
    elif environment == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()
