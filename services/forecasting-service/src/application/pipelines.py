import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta

from infrastructure.feature_store import FeatureStore
from domain.models import ForecastResult, DriftReport

# We assume sc_events is available in PYTHONPATH
from sc_events.producer import AsyncKafkaProducer
from sc_events.envelope import EventEnvelope, EventMetadata
from sc_events.registry import TopicRegistry

logger = logging.getLogger(__name__)

class EnsembleForecaster:
    """Production-grade interface representing the XGBoost + TFT ensemble."""
    
    def __init__(self, feature_store: FeatureStore, producer: AsyncKafkaProducer):
        self.feature_store = feature_store
        self.producer = producer
        self.version = "ensemble-v1.2"

    async def _predict_xgboost(self, lags: List[int]) -> float:
        # Stub: Real implementation would invoke the serialized booster
        base = sum(lags[:7]) / 7 if lags else 0
        return base * 1.05

    async def _predict_tft(self, lags: List[int]) -> float:
        # Stub: Real implementation would invoke the PyTorch Forecasting model
        base = sum(lags[:14]) / 14 if len(lags) >= 14 else (sum(lags)/len(lags) if lags else 0)
        return base * 1.10

    async def generate_forecast(self, sku: str, warehouse_id: str, horizon_days: int = 1) -> ForecastResult:
        # 1. Fetch Features from Redis Store
        lags = await self.feature_store.get_historical_lags(sku, warehouse_id, days=30)
        
        # 2. Run Inference
        xgb_pred = await self._predict_xgboost(lags)
        tft_pred = await self._predict_tft(lags)
        
        # 3. Ensemble (Weighted Average)
        weights = {"xgboost": 0.4, "tft": 0.6}
        final_pred = (xgb_pred * weights["xgboost"]) + (tft_pred * weights["tft"])
        
        # 4. Confidence Intervals (Heuristic stub)
        conf_lower = max(0, final_pred * 0.85)
        conf_upper = final_pred * 1.15

        target_date = datetime.utcnow() + timedelta(days=horizon_days)

        result = ForecastResult(
            sku=sku,
            warehouse_id=warehouse_id,
            target_date=target_date,
            predicted_demand=final_pred,
            confidence_lower=conf_lower,
            confidence_upper=conf_upper,
            model_version=self.version,
            ensemble_weights=weights
        )

        # 5. Emit Kafka Event
        envelope = EventEnvelope(
            metadata=EventMetadata(
                event_type="ForecastGenerated"
            ),
            payload={
                "sku": sku,
                "warehouse_id": warehouse_id,
                "target_date": target_date.isoformat(),
                "predicted_demand": final_pred,
                "confidence_lower": conf_lower,
                "confidence_upper": conf_upper
            }
        )
        await self.producer.publish(TopicRegistry.FORECAST_GENERATED, envelope)
        
        logger.info(f"Forecast generated for {sku} in {warehouse_id}: {final_pred}")
        return result

class DriftMonitor:
    def __init__(self, producer: AsyncKafkaProducer):
        self.producer = producer

    async def check_drift(self, sku: str, warehouse_id: str, actual_demand: float, predicted_demand: float):
        """Calculate prediction drift and emit alerts if threshold exceeded."""
        if predicted_demand == 0:
            return
            
        error_margin = abs(actual_demand - predicted_demand) / predicted_demand
        threshold = 0.25 # 25% error tolerance
        
        if error_margin > threshold:
            logger.warning(f"DRIFT DETECTED: {sku} in {warehouse_id}. Error: {error_margin:.2f}")
            envelope = EventEnvelope(
                metadata=EventMetadata(event_type="ForecastDriftDetected"),
                payload={
                    "sku": sku,
                    "warehouse_id": warehouse_id,
                    "actual": actual_demand,
                    "predicted": predicted_demand,
                    "error_margin": error_margin,
                    "threshold": threshold
                }
            )
            await self.producer.publish(TopicRegistry.FORECAST_FAILED, envelope) # Using DLQ/Fail topic for drift alerts
