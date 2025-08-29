"""
Shared configuration for workers
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/ai_defense"
    clickhouse_url: str = "http://localhost:8123"
    clickhouse_database: str = "ai_defense_events"
    redis_url: str = "redis://localhost:6379"
    
    # Message Queue
    nats_url: str = "nats://localhost:4222"
    
    # Object Storage
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "ai-defense-assets"
    s3_region: str = "us-east-1"
    
    # AI Services
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    
    # Email Services
    sendgrid_api_key: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    
    # SMS Services
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    msg91_api_key: Optional[str] = None
    
    # Chat Services
    slack_bot_token: Optional[str] = None
    teams_webhook_url: Optional[str] = None
    
    # Security
    content_safety_enabled: bool = True
    max_template_length: int = 10000
    allowed_domains: List[str] = ["localhost", "127.0.0.1"]
    
    # Rate Limiting
    delivery_rate_limit: int = 100  # per minute
    content_generation_rate_limit: int = 50  # per minute
    
    # Environment
    environment: str = "development"
    debug: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()
