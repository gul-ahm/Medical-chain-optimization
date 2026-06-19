import pytest
from sc_schemas.domain import InventoryReservedPayload, InventoryDeductedPayload, ForecastPayload, OptimizationPayload
from sc_events.envelope import EventEnvelope, EventMetadata

def test_inventory_reserved_schema():
    payload = {
        "reservation_id": "res-123",
        "sku": "SKU-001",
        "warehouse_id": "WH-1",
        "quantity": 10
    }
    # Validate payload
    model = InventoryReservedPayload(**payload)
    assert model.reservation_id == "res-123"

    # Validate envelope
    envelope_data = {
        "metadata": {
            "event_type": "InventoryReserved",
            "correlation_id": "corr-123"
        },
        "payload": payload
    }
    envelope = EventEnvelope[InventoryReservedPayload](**envelope_data)
    assert envelope.metadata.event_type == "InventoryReserved"
    assert isinstance(envelope.payload, InventoryReservedPayload)

def test_inventory_deducted_schema():
    payload = {
        "sku": "SKU-001",
        "warehouse_id": "WH-1",
        "deducted_quantity": 5
    }
    model = InventoryDeductedPayload(**payload)
    assert model.deducted_quantity == 5

def test_forecast_schema():
    payload = {
        "product_id": "PROD-1",
        "horizon_days": 30,
        "forecast": [{"date": "2026-05-12", "qty": 100}]
    }
    model = ForecastPayload(**payload)
    assert len(model.forecast) == 1

def test_optimization_schema():
    payload = {
        "source_node": "WH-1",
        "dest_node": "WH-2",
        "sku": "SKU-001",
        "quantity": 50,
        "confidence": 0.95
    }
    model = OptimizationPayload(**payload)
    assert model.confidence == 0.95
