import logging
from typing import Dict, Any

from domain.models import ApprovalRequest, AuditLog

# We assume sc_events is in PYTHONPATH
from sc_events.producer import AsyncKafkaProducer
from sc_events.envelope import EventEnvelope, EventMetadata

logger = logging.getLogger(__name__)

class ApprovalEngine:
    """Evaluates policies and manages the Human-in-the-Loop queue."""
    def __init__(self, producer: AsyncKafkaProducer):
        self.producer = producer

    async def evaluate_transfer(self, payload: Dict[str, Any]):
        """Evaluates an automated transfer recommendation against thresholds."""
        data = payload.get("payload", {})
        qty = data.get("recommended_transfer_qty", 0)
        
        # Policy Threshold: Auto-approve < 100 units. Otherwise require operations_admin.
        if qty < 100:
            logger.info(f"Transfer of {qty} auto-approved by Policy Engine.")
            await self._emit_approved(data)
        else:
            logger.warning(f"Transfer of {qty} exceeds threshold. Queueing for Human Approval.")
            # In a real app, we would persist this ApprovalRequest to Postgres here
            # For architectural structure, we simulate generating the request ID
            request_id = f"req-{data.get('sku')}-{qty}"
            
            await self.producer.publish("evt.approval.requested", EventEnvelope(
                metadata=EventMetadata(event_type="ApprovalRequested"),
                payload={
                    "request_id": request_id,
                    "action_type": "TRANSFER_EXECUTION",
                    "required_role": "operations_admin",
                    "data": data
                }
            ))

    async def process_manual_decision(self, request_id: str, actor_id: str, decision: str):
        """Processes a human click from the Next.js Approval Dashboard."""
        logger.info(f"User {actor_id} {decision} request {request_id}")
        
        # We assume we fetched the payload from the DB here
        mock_payload = {"sku": "SKU-99", "recommended_transfer_qty": 500}
        
        if decision == "APPROVED":
            await self._emit_approved(mock_payload)
        else:
            await self.producer.publish("evt.approval.rejected", EventEnvelope(
                metadata=EventMetadata(event_type="ApprovalRejected"),
                payload={"request_id": request_id, "reason": "Manually rejected by admin"}
            ))

    async def _emit_approved(self, data: dict):
        """Triggers the Orchestrator to begin the Saga."""
        await self.producer.publish("evt.transfer.recommended", EventEnvelope(
            metadata=EventMetadata(event_type="TransferApprovedForExecution"),
            payload=data
        ))
