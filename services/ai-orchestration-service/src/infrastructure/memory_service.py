import redis
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class AIMemoryService:
    """
    TASK 6: Long-Horizon Operational Memory.
    Provides short-term interaction tracking and long-term persistent incident memory graphs
    with high-fidelity in-memory failover for Redis outages.
    """
    
    def __init__(self, host='localhost', port=6379, db=2):
        self.ttl = 86400 * 7 # 7 days for short-term
        self.long_term_ttl = 86400 * 365 # 1 year for enterprise maturity
        self._fallback_memory = {}
        try:
            self.redis = redis.Redis(host=host, port=port, db=db, decode_responses=True, socket_connect_timeout=1.0)
            # Ping test to check if redis server is actually online
            self.redis.ping()
            self._redis_available = True
            logger.info("Connected to Redis for AIMemoryService.")
        except Exception as e:
            self._redis_available = False
            logger.warning(f"Redis server is offline or unreachable: {e}. Activating in-memory backup storage.")

    def store_interaction(self, warehouse_id: str, agent_type: str, interaction: Dict[str, Any]):
        """Stores an interaction for future context."""
        if self._redis_available:
            try:
                key = f"ai_memory:{warehouse_id}:{agent_type}"
                self.redis.lpush(key, json.dumps(interaction))
                self.redis.ltrim(key, 0, 19) # Keep last 20 interactions
                self.redis.expire(key, self.ttl)
                return
            except Exception as e:
                logger.warning(f"Redis write error, falling back to local memory: {e}")
        
        # Local memory fallback
        key = f"{warehouse_id}:{agent_type}"
        if key not in self._fallback_memory:
            self._fallback_memory[key] = []
        self._fallback_memory[key].insert(0, interaction)
        self._fallback_memory[key] = self._fallback_memory[key][:20]

    def get_context(self, warehouse_id: str, agent_type: str) -> List[Dict[str, Any]]:
        """Retrieves past interactions for historical grounding."""
        if self._redis_available:
            try:
                key = f"ai_memory:{warehouse_id}:{agent_type}"
                data = self.redis.lrange(key, 0, -1)
                return [json.loads(i) for i in data]
            except Exception as e:
                logger.warning(f"Redis read error, falling back to local memory: {e}")
        
        key = f"{warehouse_id}:{agent_type}"
        return self._fallback_memory.get(key, [])

    def store_incident_memory(self, incident_type: str, detail: Dict[str, Any]):
        """
        TASK 6: Stores long-term incident memory for recurring pattern detection.
        """
        record = {
            "timestamp": str(datetime.now()),
            "details": detail,
            "signature": self._generate_incident_signature(detail)
        }
        if self._redis_available:
            try:
                key = f"ai_incident_graph:{incident_type}"
                self.redis.lpush(key, json.dumps(record))
                self.redis.ltrim(key, 0, 99) # Keep last 100 historical incidents
                self.redis.expire(key, self.long_term_ttl)
                return
            except Exception as e:
                logger.warning(f"Redis write incident error: {e}")
        
        # Fallback
        key = f"incident:{incident_type}"
        if key not in self._fallback_memory:
            self._fallback_memory[key] = []
        self._fallback_memory[key].insert(0, record)
        self._fallback_memory[key] = self._fallback_memory[key][:100]

    def _generate_incident_signature(self, detail: Dict[str, Any]) -> str:
        """Generates a unique signature to detect recurring patterns."""
        return f"{detail.get('region')}:{detail.get('sku')}:{detail.get('root_cause')}"

    def get_recurring_patterns(self, incident_type: str) -> List[Dict[str, Any]]:
        """Retrieves historical incidents to detect systemic failures."""
        if self._redis_available:
            try:
                key = f"ai_incident_graph:{incident_type}"
                data = self.redis.lrange(key, 0, -1)
                return [json.loads(i) for i in data]
            except Exception as e:
                logger.warning(f"Redis read incident patterns error: {e}")
        
        key = f"incident:{incident_type}"
        return self._fallback_memory.get(key, [])

    def store_decision(self, decision_id: str, status: str, operator_id: str, metadata: Dict[str, Any] = None):
        """
        TASK 9: Stores human approval/rejection decision for an AI recommendation.
        """
        payload = {
            "status": status, # APPROVED | REJECTED | OVERRIDDEN
            "operator_id": operator_id,
            "timestamp": str(datetime.now()),
            "metadata": metadata or {}
        }
        if self._redis_available:
            try:
                key = f"ai_decision:{decision_id}"
                self.redis.set(key, json.dumps(payload), ex=self.long_term_ttl)
                logger.info(f"Decision {status} recorded for {decision_id}")
                return
            except Exception as e:
                logger.warning(f"Redis set decision error: {e}")
        
        key = f"decision:{decision_id}"
        self._fallback_memory[key] = payload

    def get_decision(self, decision_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a specific decision record."""
        if self._redis_available:
            try:
                key = f"ai_decision:{decision_id}"
                data = self.redis.get(key)
                return json.loads(data) if data else None
            except Exception as e:
                logger.warning(f"Redis get decision error: {e}")
        
        key = f"decision:{decision_id}"
        return self._fallback_memory.get(key, None)
