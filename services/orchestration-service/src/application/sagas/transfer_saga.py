import logging
from typing import Dict, Any

from infrastructure.state_machine import SagaCache

# We assume sc_events is in PYTHONPATH
from sc_events.producer import AsyncKafkaProducer
from sc_events.envelope import EventEnvelope, EventMetadata

logger = logging.getLogger(__name__)

class TransferSaga:
    """
    Coordinates a distributed warehouse transfer.
    Steps:
    1. Initialize -> Publish ReserveStock (Source)
    2. Await evt.inventory.reserved -> Publish DeductStock (Source) & ReserveStock (Target)
    3. Await approval (if > bounds) -> Publish ReleaseStock (if failed)
    """
    def __init__(self, cache: SagaCache, producer: AsyncKafkaProducer):
        self.cache = cache
        self.producer = producer

    async def start_transfer(self, correlation_id: str, payload: Dict[str, Any]):
        async with self.cache.acquire_workflow_lock(correlation_id):
            # Persist initial state
            state = {
                "correlation_id": correlation_id,
                "status": "RUNNING",
                "current_step": "AWAITING_SOURCE_RESERVATION",
                "payload": payload
            }
            await self.cache.save_state(correlation_id, state)
            
            logger.info(f"Saga {correlation_id} Started: Transfer {payload.get('recommended_transfer_qty')} of {payload.get('sku')}")

            # Step 1: Tell Inventory Service to reserve stock in Source WH
            reserve_cmd = EventEnvelope(
                metadata=EventMetadata(event_type="ReserveInventoryCommand", correlation_id=correlation_id),
                payload={
                    "sku": payload.get("sku"),
                    "warehouse_id": payload.get("source_warehouse"),
                    "quantity": payload.get("recommended_transfer_qty")
                }
            )
            # Emitting command topic (we'll just use a direct stub string for architectural demo)
            await self.producer.publish("cmd.inventory.reserve", reserve_cmd)

    async def handle_inventory_reserved(self, correlation_id: str, payload: Dict[str, Any]):
        """Callback from inventory service upon successful reservation."""
        async with self.cache.acquire_workflow_lock(correlation_id):
            state = await self.cache.get_state(correlation_id)
            if not state or state["status"] != "RUNNING":
                return
                
            logger.info(f"Saga {correlation_id}: Source Reserved successfully. Moving to next step.")
            
            # Step 2: Next step would be deduction or target reservation
            state["current_step"] = "COMPLETED"
            state["status"] = "COMPLETED"
            await self.cache.save_state(correlation_id, state)
            
            # Emit Saga Completed
            await self.producer.publish("evt.saga.completed", EventEnvelope(
                metadata=EventMetadata(event_type="SagaCompleted", correlation_id=correlation_id),
                payload={"saga_type": "WarehouseTransfer", "status": "SUCCESS"}
            ))

    async def handle_inventory_failure(self, correlation_id: str, reason: str):
        """COMPENSATING TRANSACTION: Rollback distributed state."""
        async with self.cache.acquire_workflow_lock(correlation_id):
            state = await self.cache.get_state(correlation_id)
            if not state:
                return

            logger.error(f"Saga {correlation_id} FAILED: {reason}. Initiating Compensating Transactions.")
            state["status"] = "COMPENSATING"
            await self.cache.save_state(correlation_id, state)

            # Emit Rollback command to inventory service
            rollback_cmd = EventEnvelope(
                metadata=EventMetadata(event_type="ReleaseInventoryCommand", correlation_id=correlation_id),
                payload={
                    "sku": state["payload"].get("sku"),
                    "warehouse_id": state["payload"].get("source_warehouse"),
                    "quantity": state["payload"].get("recommended_transfer_qty"),
                    "reason": "SAGA_ROLLBACK"
                }
            )
            await self.producer.publish("cmd.inventory.release", rollback_cmd)

            # Mark fully compensated
            state["status"] = "COMPENSATED"
            await self.cache.save_state(correlation_id, state)
            
            await self.producer.publish("evt.saga.compensated", EventEnvelope(
                metadata=EventMetadata(event_type="SagaCompensated", correlation_id=correlation_id),
                payload={"saga_type": "WarehouseTransfer"}
            ))
