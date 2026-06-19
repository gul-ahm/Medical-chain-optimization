import logging
from typing import Dict, Any
from dateutil.parser import parse

from infrastructure.feature_store import FeatureStore

logger = logging.getLogger(__name__)

class InventoryEventHandler:
    def __init__(self, feature_store: FeatureStore):
        self.feature_store = feature_store

    async def handle_deducted(self, payload: Dict[str, Any]):
        """Consumes evt.inventory.deducted to update the Feature Store."""
        try:
            data = payload.get("payload", {})
            from sc_schemas.data_engine import engine
            
            # Adaptive Key Resolution
            sku = data.get(engine.get_canonical_column("inventory_event", "product_id") or "sku")
            warehouse_id = data.get("warehouse_id") # warehouse_id is usually stable, but could be mapped too
            quantity = data.get("deducted_quantity") or data.get("quantity") or 0
            
            meta = payload.get("metadata", {})
            timestamp_str = meta.get("timestamp")
            
            if not sku or not warehouse_id:
                logger.error("Missing required fields in inventory event.")
                return

            timestamp = parse(timestamp_str) if timestamp_str else None
            from datetime import datetime
            timestamp = timestamp or datetime.utcnow()

            await self.feature_store.record_demand(sku, warehouse_id, quantity, timestamp)
            logger.info(f"Ingested deduction into Feature Store: {sku} in {warehouse_id}")

        except Exception as e:
            logger.error(f"Failed to ingest inventory event: {e}")
            raise
