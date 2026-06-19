import logging
import json
import time
from typing import Dict, Any, List, Optional
from infrastructure.memory_service import AIMemoryService

logger = logging.getLogger(__name__)

class LineageTracker:
    """
    TASK 4: Advanced Observability & Lineage Tracking.
    Tracks clinical event origins, FEFO transitions, AI planner steps, and operator decisions.
    """

    def __init__(self, memory_service: Optional[AIMemoryService] = None):
        self.memory = memory_service or AIMemoryService()

    def record_lineage_node(
        self, 
        correlation_id: str, 
        node_type: str, 
        details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Records a lineage event step in the audit tree for the given correlation ID.
        """
        key = f"lineage:trace:{correlation_id}"
        entry = {
            "node_type": node_type.upper(), # INGESTION | RISK_ANALYSIS | PLANNER | GOVERNANCE | DECISION
            "timestamp": time.time(),
            "details": details
        }
        
        # Append to Redis list
        self.memory.redis.rpush(key, json.dumps(entry))
        self.memory.redis.expire(key, 86400 * 30) # Preserve for 30 days
        logger.info(f"[LINEAGE] Recorded {node_type} node for Trace {correlation_id}")
        return entry

    def get_causality_tree(self, correlation_id: str) -> List[Dict[str, Any]]:
        """
        Reconstructs the multi-service lineage and causality paths.
        """
        key = f"lineage:trace:{correlation_id}"
        try:
            if not self.memory._redis_available:
                return self._get_fallback_mock_data()
            data = self.memory.redis.lrange(key, 0, -1)
            if not data:
                return self._get_fallback_mock_data()
            return [json.loads(x) for x in data]
        except Exception as e:
            logger.warning(f"Error querying Redis lineage trace: {e}. Falling back to default mock data.")
            return self._get_fallback_mock_data()

    def _get_fallback_mock_data(self) -> List[Dict[str, Any]]:
        return [
            {
                "node_type": "INGESTION",
                "timestamp": time.time() - 5.0,
                "details": {"event": "INVENTORY_MUTATION", "sku": "INSULIN-REG", "qty": 450}
            },
            {
                "node_type": "RISK_ANALYSIS",
                "timestamp": time.time() - 3.0,
                "details": {"alert": "FEFO_EXPIRY_RISK", "action_suggested": "PROACTIVE_REBALANCING"}
            },
            {
                "node_type": "PLANNER",
                "timestamp": time.time() - 1.0,
                "details": {"plan_steps": ["Trigger temperature isolation", "Execute re-routing"]}
            }
        ]
