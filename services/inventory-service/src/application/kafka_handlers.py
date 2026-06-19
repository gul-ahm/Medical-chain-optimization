import logging
from typing import Dict, Any
from application.services import InventoryApplicationService

logger = logging.getLogger(__name__)

class InventoryCommandHandler:
    def __init__(self, service: InventoryApplicationService):
        self.service = service

    async def handle_reserve(self, payload: Dict[str, Any]):
        try:
            metadata = payload.get("metadata", {})
            data = payload.get("payload", {})
            correlation_id = metadata.get("correlation_id")
            
            logger.info(f"Handling ReserveStock command for {data.get('sku')}")
            await self.service.reserve_stock(
                sku=data.get("sku"),
                warehouse_id=data.get("warehouse_id"),
                quantity=data.get("quantity"),
                correlation_id=correlation_id
            )
        except Exception as e:
            logger.error(f"Failed to handle ReserveStock: {e}")

    async def handle_deduct(self, payload: Dict[str, Any]):
        try:
            metadata = payload.get("metadata", {})
            data = payload.get("payload", {})
            correlation_id = metadata.get("correlation_id")
            
            logger.info(f"Handling DeductStock command for reservation {data.get('reservation_id')}")
            await self.service.deduct_stock(
                reservation_id=data.get("reservation_id"),
                correlation_id=correlation_id
            )
        except Exception as e:
            logger.error(f"Failed to handle DeductStock: {e}")
