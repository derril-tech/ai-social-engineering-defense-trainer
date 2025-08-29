"""
Database connections and utilities
"""

import asyncio
import logging
from typing import Optional
import asyncpg
import aioredis
from clickhouse_driver import Client as ClickHouseClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from .config import get_settings

logger = logging.getLogger(__name__)

# Global connections
pg_pool: Optional[asyncpg.Pool] = None
redis_client: Optional[aioredis.Redis] = None
clickhouse_client: Optional[ClickHouseClient] = None
async_engine = None
async_session_factory = None

async def init_database():
    """Initialize database connections"""
    global pg_pool, redis_client, clickhouse_client, async_engine, async_session_factory
    
    settings = get_settings()
    
    try:
        # PostgreSQL connection pool
        pg_pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=5,
            max_size=20,
            command_timeout=60
        )
        logger.info("PostgreSQL pool initialized")
        
        # Redis connection
        redis_client = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True
        )
        await redis_client.ping()
        logger.info("Redis connection initialized")
        
        # ClickHouse connection
        clickhouse_client = ClickHouseClient(
            host=settings.clickhouse_url.replace("http://", "").split(":")[0],
            port=int(settings.clickhouse_url.split(":")[-1]) if ":" in settings.clickhouse_url else 8123,
            database=settings.clickhouse_database
        )
        # Test connection
        clickhouse_client.execute("SELECT 1")
        logger.info("ClickHouse connection initialized")
        
        # SQLAlchemy async engine
        async_engine = create_async_engine(
            settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
            echo=settings.debug
        )
        async_session_factory = sessionmaker(
            async_engine, class_=AsyncSession, expire_on_commit=False
        )
        logger.info("SQLAlchemy async engine initialized")
        
    except Exception as e:
        logger.error(f"Failed to initialize database connections: {e}")
        raise

async def get_pg_connection():
    """Get PostgreSQL connection from pool"""
    if not pg_pool:
        raise RuntimeError("PostgreSQL pool not initialized")
    return await pg_pool.acquire()

async def get_redis_client():
    """Get Redis client"""
    if not redis_client:
        raise RuntimeError("Redis client not initialized")
    return redis_client

def get_clickhouse_client():
    """Get ClickHouse client"""
    if not clickhouse_client:
        raise RuntimeError("ClickHouse client not initialized")
    return clickhouse_client

async def get_async_session():
    """Get SQLAlchemy async session"""
    if not async_session_factory:
        raise RuntimeError("Async session factory not initialized")
    return async_session_factory()

async def close_database():
    """Close all database connections"""
    global pg_pool, redis_client, clickhouse_client, async_engine
    
    if pg_pool:
        await pg_pool.close()
        logger.info("PostgreSQL pool closed")
    
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection closed")
    
    if clickhouse_client:
        clickhouse_client.disconnect()
        logger.info("ClickHouse connection closed")
    
    if async_engine:
        await async_engine.dispose()
        logger.info("SQLAlchemy engine disposed")
