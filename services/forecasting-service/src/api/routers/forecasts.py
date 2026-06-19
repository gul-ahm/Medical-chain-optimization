import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from application.pipelines import EnsembleForecaster
from infrastructure.feature_store import FeatureStore

# We assume sc_schemas is in PYTHONPATH
from sc_schemas.api.responses import StandardResponse, ResponseMetadata
from sc_events.producer import AsyncKafkaProducer

router = APIRouter(prefix="/api/v1/forecasts", tags=["forecasts"])
logger = logging.getLogger(__name__)

class ForecastRequest(BaseModel):
    sku: str
    warehouse_id: str
    horizon_days: int = 1

# Dependency injection stubs
async def get_feature_store() -> FeatureStore:
    return FeatureStore()

async def get_producer() -> AsyncKafkaProducer:
    return AsyncKafkaProducer()

async def get_forecaster(
    store: FeatureStore = Depends(get_feature_store),
    producer: AsyncKafkaProducer = Depends(get_producer)
) -> EnsembleForecaster:
    return EnsembleForecaster(feature_store=store, producer=producer)

@router.post("/generate", response_model=StandardResponse[Dict[str, Any]])
async def generate_forecast(
    request: ForecastRequest,
    x_correlation_id: str = Header(...),
    forecaster: EnsembleForecaster = Depends(get_forecaster)
):
    try:
        result = await forecaster.generate_forecast(
            sku=request.sku, 
            warehouse_id=request.warehouse_id,
            horizon_days=request.horizon_days
        )
        
        return StandardResponse(
            data={
                "predicted_demand": result.predicted_demand,
                "confidence_bounds": [result.confidence_lower, result.confidence_upper],
                "model_version": result.model_version
            },
            meta=ResponseMetadata(message="Forecast generated", correlation_id=x_correlation_id)
        )
    except Exception as e:
        logger.error(f"Forecast generation failed: {e}")
        raise HTTPException(status_code=500, detail="Inference pipeline failure")
