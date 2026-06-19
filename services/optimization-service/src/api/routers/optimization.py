import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from application.orchestrator import TwinOrchestrator
from infrastructure.solver import MILPSolver
from infrastructure.state_cache import StateCache

# We assume sc_schemas is in PYTHONPATH
from sc_schemas.api.responses import StandardResponse, ResponseMetadata
from sc_events.producer import AsyncKafkaProducer

router = APIRouter(prefix="/api/v1/optimization", tags=["optimization"])
logger = logging.getLogger(__name__)

class OptimizationRequest(BaseModel):
    sku: str
    warehouse_id: str
    predicted_demand: float

# Dependency injection stubs
async def get_orchestrator() -> TwinOrchestrator:
    return TwinOrchestrator(MILPSolver(), StateCache(), AsyncKafkaProducer())

@router.post("/generate", response_model=StandardResponse[Dict[str, Any]])
async def generate_optimization(
    request: OptimizationRequest,
    x_correlation_id: str = Header(...),
    orchestrator: TwinOrchestrator = Depends(get_orchestrator)
):
    try:
        # Trigger the manual optimization cycle
        await orchestrator.run_optimization_cycle(request.dict())
        
        return StandardResponse(
            data={"status": "OPTIMIZATION_TRIGGERED"},
            meta=ResponseMetadata(message="Optimization generated", correlation_id=x_correlation_id)
        )
    except Exception as e:
        logger.error(f"Optimization generation failed: {e}")
        raise HTTPException(status_code=500, detail="Solver failure")
