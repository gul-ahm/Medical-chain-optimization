import logging
from typing import Dict, Any

from infrastructure.solver import MILPSolver
from infrastructure.state_cache import StateCache

# We assume sc_events is in PYTHONPATH
from sc_events.producer import AsyncKafkaProducer
from sc_events.envelope import EventEnvelope, EventMetadata

logger = logging.getLogger(__name__)

class TwinOrchestrator:
    """Orchestrates Digital Twin scenario building and optimization execution."""
    
    def __init__(self, solver: MILPSolver, cache: StateCache, producer: AsyncKafkaProducer):
        self.solver = solver
        self.cache = cache
        self.producer = producer

    async def run_optimization_cycle(self, forecast_payload: Dict[str, Any]):
        """Triggered by a new forecast event to balance inventory."""
        sku = forecast_payload.get("sku")
        
        # 1. Fetch Global State
        global_stock = await self.cache.get_global_stock(sku)
        
        # 2. Run MILP Solver
        recommendations = await self.solver.calculate_optimal_transfers(
            inventory_state=global_stock,
            forecast=forecast_payload
        )
        
        # 3. Emit Recommendation Events
        for rec in recommendations:
            envelope = EventEnvelope(
                metadata=EventMetadata(event_type="TransferRecommended"),
                payload=rec
            )
            # In real system, topic registry constant
            await self.producer.publish("evt.transfer.recommended", envelope)
            logger.info(f"Published recommendation: Transfer {rec['recommended_transfer_qty']} {sku}")

        # 4. Emit Optimization Generated Event
        await self.producer.publish(
            "evt.optimization.generated",
            EventEnvelope(
                metadata=EventMetadata(event_type="OptimizationGenerated"),
                payload={"sku": sku, "recommendations_count": len(recommendations)}
            )
        )
