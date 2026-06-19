import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from redis.asyncio import Redis

logger = logging.getLogger(__name__)

import os

class FeatureStore:
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = Redis.from_url(self.redis_url, decode_responses=True)

    def _get_key(self, sku: str, warehouse_id: str, date_str: str) -> str:
        return f"demand:{warehouse_id}:{sku}:{date_str}"

    async def record_demand(self, sku: str, warehouse_id: str, quantity: int, timestamp: datetime):
        """Aggregate real-time inventory deductions into daily demand buckets."""
        date_str = timestamp.strftime("%Y-%m-%d")
        key = self._get_key(sku, warehouse_id, date_str)
        
        # Increment the daily demand
        await self.redis.incrby(key, quantity)
        # Set expiry to 90 days to keep the sliding window
        await self.redis.expire(key, 90 * 86400)
        logger.debug(f"Recorded demand for {key}: +{quantity}")

    async def get_historical_lags(self, sku: str, warehouse_id: str, days: int = 30) -> List[int]:
        """Fetch historical lag features for the ML models."""
        today = datetime.utcnow()
        keys = [
            self._get_key(sku, warehouse_id, (today - timedelta(days=i)).strftime("%Y-%m-%d"))
            for i in range(1, days + 1)
        ]
        
        # Pipeline fetch to minimize network roundtrips
        results = await self.redis.mget(keys)
        
        # Parse integers, defaulting missing days to 0
        lags = [int(val) if val else 0 for val in results]
        return lags
