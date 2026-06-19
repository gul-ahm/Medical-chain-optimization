import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from application.pipelines import EnsembleForecaster, DriftMonitor
from application.kafka_handlers import InventoryEventHandler

@pytest.mark.asyncio
async def test_ensemble_forecaster():
    mock_feature_store = MagicMock()
    # Mock returning 30 days of lag data
    mock_feature_store.get_historical_lags = AsyncMock(return_value=[10] * 30)
    
    mock_producer = AsyncMock()
    
    forecaster = EnsembleForecaster(mock_feature_store, mock_producer)
    
    result = await forecaster.generate_forecast("SKU-1", "WH-1", 1)
    
    assert result.sku == "SKU-1"
    assert result.predicted_demand > 0
    assert result.confidence_upper > result.confidence_lower
    mock_producer.publish.assert_called_once()

@pytest.mark.asyncio
async def test_drift_monitor_triggers_alert():
    mock_producer = AsyncMock()
    monitor = DriftMonitor(mock_producer)
    
    # 50 actual vs 10 predicted -> Massive drift
    await monitor.check_drift("SKU-1", "WH-1", actual_demand=50, predicted_demand=10)
    
    mock_producer.publish.assert_called_once()

@pytest.mark.asyncio
async def test_inventory_handler_ingestion():
    mock_feature_store = MagicMock()
    mock_feature_store.record_demand = AsyncMock()
    
    handler = InventoryEventHandler(mock_feature_store)
    
    payload = {
        "metadata": {"timestamp": "2026-05-11T12:00:00Z"},
        "payload": {
            "sku": "SKU-99",
            "warehouse_id": "WH-A",
            "deducted_quantity": 5
        }
    }
    
    await handler.handle_deducted(payload)
    mock_feature_store.record_demand.assert_called_once()
