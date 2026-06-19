import logging
from typing import Optional
from redis.asyncio import Redis
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

import os

class RedisLockManager:
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = Redis.from_url(self.redis_url)

    @asynccontextmanager
    async def acquire_lock(self, lock_key: str, timeout: int = 10):
        """Acquire a distributed lock using Redis."""
        # Note: In production, use Redlock algorithm. This is a simplified lock for demonstration.
        lock_id = f"lock:{lock_key}"
        acquired = await self.redis.set(lock_id, "locked", nx=True, ex=timeout)
        
        if not acquired:
            raise Exception(f"Failed to acquire lock for {lock_key}")
            
        try:
            yield
        finally:
            await self.redis.delete(lock_id)

class IdempotencyManager:
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = Redis.from_url(self.redis_url)

    async def is_processed(self, key: str) -> bool:
        exists = await self.redis.exists(f"idemp:{key}")
        return exists > 0

    async def mark_processed(self, key: str, ttl: int = 86400):
        await self.redis.set(f"idemp:{key}", "done", ex=ttl)
