import json
import logging
from redis.asyncio import Redis
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

from typing import Optional
import os

class SagaCache:
    """Manages fast lookup of running saga states and idempotency."""
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = Redis.from_url(self.redis_url, decode_responses=True)

    @asynccontextmanager
    async def acquire_workflow_lock(self, correlation_id: str, timeout: int = 30):
        """Prevents race conditions when concurrent Kafka events hit the same Saga."""
        lock_id = f"saga_lock:{correlation_id}"
        acquired = await self.redis.set(lock_id, "locked", nx=True, ex=timeout)
        
        if not acquired:
            raise Exception(f"Failed to acquire saga lock for {correlation_id}. Processing already in progress.")
            
        try:
            yield
        finally:
            await self.redis.delete(lock_id)

    async def get_state(self, correlation_id: str) -> dict:
        data = await self.redis.get(f"saga_state:{correlation_id}")
        return json.loads(data) if data else None

    async def save_state(self, correlation_id: str, state: dict):
        # Cache for 24 hours
        await self.redis.set(f"saga_state:{correlation_id}", json.dumps(state), ex=86400)
