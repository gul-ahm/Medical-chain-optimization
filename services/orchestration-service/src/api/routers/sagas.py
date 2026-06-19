import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from infrastructure.state_machine import SagaCache
from application.sagas.transfer_saga import TransferSaga

# We assume sc_schemas is in PYTHONPATH
from sc_schemas.api.responses import StandardResponse, ResponseMetadata
from sc_events.producer import AsyncKafkaProducer

router = APIRouter(prefix="/api/v1/sagas", tags=["sagas"])
logger = logging.getLogger(__name__)

# Dependency injection stubs
async def get_saga_cache() -> SagaCache:
    return SagaCache()

async def get_transfer_saga(cache: SagaCache = Depends(get_saga_cache)) -> TransferSaga:
    return TransferSaga(cache, AsyncKafkaProducer())

@router.get("/{correlation_id}/status", response_model=StandardResponse[Dict[str, Any]])
async def get_saga_status(
    correlation_id: str,
    x_correlation_id: str = Header(default="api-req"),
    cache: SagaCache = Depends(get_saga_cache)
):
    state = await cache.get_state(correlation_id)
    if not state:
        raise HTTPException(status_code=404, detail="Saga not found or expired from cache")
        
    return StandardResponse(
        data=state,
        meta=ResponseMetadata(message="Saga status retrieved", correlation_id=x_correlation_id)
    )

@router.post("/{correlation_id}/compensate", response_model=StandardResponse[Dict[str, Any]])
async def manual_compensate(
    correlation_id: str,
    x_correlation_id: str = Header(default="api-req"),
    saga: TransferSaga = Depends(get_transfer_saga)
):
    """Manual override endpoint for governance/admin users to force rollback."""
    try:
        await saga.handle_inventory_failure(correlation_id, reason="MANUAL_ADMIN_OVERRIDE")
        return StandardResponse(
            data={"status": "COMPENSATION_TRIGGERED"},
            meta=ResponseMetadata(message="Rollback initiated", correlation_id=x_correlation_id)
        )
    except Exception as e:
        logger.error(f"Manual compensation failed: {e}")
        raise HTTPException(status_code=500, detail="Rollback failure")
