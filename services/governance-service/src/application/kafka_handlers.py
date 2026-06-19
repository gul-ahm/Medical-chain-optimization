import logging
from typing import Dict, Any

from application.approval_engine import ApprovalEngine

logger = logging.getLogger(__name__)

class GovernanceEventHandler:
    def __init__(self, engine: ApprovalEngine):
        self.engine = engine

    async def handle_optimization_generated(self, payload: Dict[str, Any]):
        """Intercepts raw optimization recommendations before they hit the Orchestrator."""
        try:
            logger.info("Intercepted optimization recommendation. Evaluating Governance Policy...")
            await self.engine.evaluate_transfer(payload)
        except Exception as e:
            logger.error(f"Governance evaluation failed: {e}")
            raise
