import logging
from typing import Dict, Any

from application.orchestrator import TwinOrchestrator

logger = logging.getLogger(__name__)

class OptimizationEventHandler:
    def __init__(self, orchestrator: TwinOrchestrator):
        self.orchestrator = orchestrator

    async def handle_forecast_generated(self, payload: Dict[str, Any]):
        """Consumes evt.forecast.generated and triggers MILP balancing."""
        try:
            data = payload.get("payload", {})
            logger.info(f"Received forecast generation event for {data.get('sku')}. Triggering optimization.")
            await self.orchestrator.run_optimization_cycle(data)

        except Exception as e:
            logger.error(f"Failed to process forecast event: {e}")
            raise
