import logging
from typing import Dict, Any

from application.sagas.transfer_saga import TransferSaga

logger = logging.getLogger(__name__)

class SagaEventHandler:
    def __init__(self, transfer_saga: TransferSaga):
        self.transfer_saga = transfer_saga

    async def handle_transfer_recommended(self, payload: Dict[str, Any]):
        """Starts a new Transfer Saga when Optimization recommends a move."""
        try:
            data = payload.get("payload", {})
            # Generate deterministic correlation ID for the saga
            import uuid
            correlation_id = f"saga-transfer-{uuid.uuid4()}"
            
            logger.info(f"Received transfer recommendation. Initiating Saga: {correlation_id}")
            await self.transfer_saga.start_transfer(correlation_id, data)

        except Exception as e:
            logger.error(f"Failed to initiate Transfer Saga: {e}")
            raise

    async def handle_inventory_reserved(self, payload: Dict[str, Any]):
        """Routes choreography events back to the running Saga instance."""
        meta = payload.get("metadata", {})
        correlation_id = meta.get("correlation_id")
        
        if not correlation_id or not correlation_id.startswith("saga-transfer"):
            return
            
        await self.transfer_saga.handle_inventory_reserved(correlation_id, payload.get("payload", {}))

    async def handle_inventory_failed(self, payload: Dict[str, Any]):
        """Triggers compensating transactions on failure."""
        meta = payload.get("metadata", {})
        correlation_id = meta.get("correlation_id")
        
        if not correlation_id:
            return
            
        error_msg = payload.get("payload", {}).get("error", "Unknown DLQ Failure")
        await self.transfer_saga.handle_inventory_failure(correlation_id, error_msg)
