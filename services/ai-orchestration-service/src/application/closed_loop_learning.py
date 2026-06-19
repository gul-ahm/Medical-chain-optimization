import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from infrastructure.memory_service import AIMemoryService

logger = logging.getLogger(__name__)

class ClosedLoopLearningEngine:
    """
    TASK 1 & 9: Closed-Loop Operational Learning Engine.
    Tracks mitigation outcomes, operator feedback, and tunes recommendation confidence dynamically.
    """

    def __init__(self, memory_service: Optional[AIMemoryService] = None):
        self.memory = memory_service or AIMemoryService()
        self.feedback_weight = 0.15 # Learning rate for tuning confidence

    def record_operator_action(self, recommendation_id: str, action: str, operator_id: str, feedback: Optional[str] = None):
        """
        Logs operator approvals, rejections, or manual overrides.
        Automatically updates strategy confidence levels.
        """
        metadata = {
            "action_type": action, # APPROVED | REJECTED | OVERRIDDEN
            "feedback": feedback,
            "recorded_at": str(datetime.now())
        }
        self.memory.store_decision(recommendation_id, action, operator_id, metadata)
        
        # Adjust dynamic confidence base
        self._tune_strategy_confidence(recommendation_id, action)

    def evaluate_mitigation_success(self, plan_id: str, actual_outcome: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates outcome score based on actual versus simulated values.
        Mitigation score balances stockout avoidance against logistics cost overhead.
        """
        shortage_prevented = actual_outcome.get("shortage_prevented", True)
        actual_wastage = actual_outcome.get("wastage_units", 0)
        actual_cost = actual_outcome.get("logistics_cost", 0.0)

        # Outcome score formula
        base_score = 100.0
        if not shortage_prevented:
            base_score -= 50.0
        base_score -= min(30.0, (actual_wastage * 0.5))
        base_score -= min(20.0, (actual_cost / 1000.0))

        outcome_score = max(0.0, min(100.0, base_score))
        
        # Store in Redis incident memory graph
        self.memory.store_incident_memory(
            incident_type="MITIGATION_OUTCOME",
            detail={
                "plan_id": plan_id,
                "outcome_score": outcome_score,
                "shortage_prevented": shortage_prevented,
                "wastage_units": actual_wastage,
                "logistics_cost": actual_cost,
                "timestamp": str(datetime.now())
            }
        )

        return {
            "plan_id": plan_id,
            "outcome_score": round(outcome_score, 2),
            "performance": "EXCELLENT" if outcome_score >= 85 else "ADEQUATE" if outcome_score >= 60 else "POOR"
        }

    def _tune_strategy_confidence(self, rec_id: str, action: str):
        """Dynamic tuning of AI strategy scores based on historical human input."""
        current_factor = 1.0
        if action == "REJECTED":
            current_factor = -1.0 * self.feedback_weight
        elif action == "APPROVED":
            current_factor = 0.5 * self.feedback_weight
        elif action == "OVERRIDDEN":
            current_factor = -0.5 * self.feedback_weight

        # Persist the adjusted learning feedback factor
        key = f"ai_learning_bias:{rec_id}"
        self.memory.redis.set(key, str(current_factor), ex=86400 * 30) # 30 days
        logger.info(f"Tuned learning bias for {rec_id} by factor {current_factor}")

    def get_recommendation_bias(self, rec_id: str) -> float:
        """Retrieves learned tuning factor for the recommendation engine."""
        key = f"ai_learning_bias:{rec_id}"
        data = self.memory.redis.get(key)
        return float(data) if data else 0.0
