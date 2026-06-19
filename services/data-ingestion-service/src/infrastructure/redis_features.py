import os
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from redis.asyncio import Redis

class RedisFeatureStore:
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = Redis.from_url(
            self.redis_url, 
            socket_connect_timeout=0.1, 
            socket_timeout=0.1,
            retry_on_timeout=False
        )
        self.is_offline = False

    async def set_medicine_risk(self, medicine_id: int, risk_score: float, signals: List[str]):
        if self.is_offline:
            return
        key = f"feature:medicine:{medicine_id}:risk"
        data = {
            "risk_score": risk_score,
            "signals": signals,
            "updated_at": datetime.utcnow().isoformat()
        }
        try:
            await self.redis.set(key, json.dumps(data))
        except Exception as e:
            self.is_offline = True

    async def set_rolling_demand(self, medicine_id: int, windows: Dict[str, float]):
        if self.is_offline:
            return
        key = f"feature:medicine:{medicine_id}:demand"
        try:
            await self.redis.set(key, json.dumps(windows))
        except Exception as e:
            self.is_offline = True

    async def set_supplier_latency(self, supplier_id: int, latency_days: float):
        if self.is_offline:
            return
        key = f"feature:supplier:{supplier_id}:latency"
        try:
            await self.redis.set(key, latency_days)
        except Exception as e:
            self.is_offline = True

    async def record_demand(self, sku: str, warehouse_id: str, quantity: int, timestamp: datetime):
        """Aggregate demand into daily buckets for forecasting."""
        if self.is_offline:
            return
        date_str = timestamp.strftime("%Y-%m-%d")
        key = f"demand:{warehouse_id}:{sku}:{date_str}"
        try:
            await self.redis.incrby(key, quantity)
            await self.redis.expire(key, 90 * 86400)
        except Exception as e:
            self.is_offline = True

