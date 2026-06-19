import json
import logging
from redis.asyncio import Redis

logger = logging.getLogger(__name__)

from typing import Optional
import os

class StateCache:
    """Maintains a near-realtime view of global stock for the solver."""
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = Redis.from_url(self.redis_url, decode_responses=True)

    def _get_key(self, sku: str, warehouse_id: str) -> str:
        return f"opt_cache:{warehouse_id}:{sku}"

    async def update_stock(self, sku: str, warehouse_id: str, new_quantity: int):
        key = self._get_key(sku, warehouse_id)
        await self.redis.set(key, str(new_quantity))
        
    async def get_global_stock(self, sku: str) -> dict:
        """Fetch stock levels across all warehouses for a given SKU."""
        # Note: In production, use SCAN or a Set to map warehouses.
        # This is a stub returning a mock global state.
        return {
            "WH-CENTRAL": 1000,
            "WH-EAST": 200,
            "WH-WEST": 150
        }
