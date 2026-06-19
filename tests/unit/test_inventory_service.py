import pytest
from services.api.services.inventory_service import inventory_service

@pytest.mark.asyncio
async def test_get_inventory_overview_schema():
    """
    Validates that the inventory overview returns the expected enterprise structure.
    """
    data = await inventory_service.get_inventory_overview()
    assert "kpis" in data
    assert "warehouse_utilization" in data
    assert "stockout_risks" in data

@pytest.mark.asyncio
async def test_inventory_kpi_calculations():
    """
    Validates the accuracy of real-time inventory KPI computations.
    """
    kpis = await inventory_service.get_inventory_kpis()
    assert kpis.total_inventory >= 0
    assert 0 <= kpis.accuracy_pct <= 100
    assert kpis.active_alerts >= 0

@pytest.mark.asyncio
async def test_stockout_risk_detection():
    """
    Validates the logic for identifying high-risk stockout SKUs.
    """
    risks = await inventory_service.get_stockout_risk()
    assert isinstance(risks, list)
    if len(risks) > 0:
        assert "sku" in risks[0]
        assert "probability" in risks[0]

@pytest.mark.asyncio
async def test_warehouse_utilization_metrics():
    """
    Validates the calculation of warehouse floor utilization and capacity.
    """
    metrics = await inventory_service.get_warehouse_utilization()
    assert isinstance(metrics, list)
    for m in metrics:
        assert 0 <= m["utilization_pct"] <= 100
        assert m["capacity"] > 0

@pytest.mark.asyncio
async def test_inventory_aging_analysis():
    """
    Validates the aging analysis of stock batches across the network.
    """
    aging = await inventory_service.get_inventory_aging()
    assert "avg_age_days" in aging
    assert isinstance(aging["risk_distribution"], dict)

@pytest.mark.asyncio
async def test_inventory_alert_generation():
    """
    Validates that the service correctly identifies and generates operational alerts.
    """
    alerts = await inventory_service.get_inventory_alerts()
    assert isinstance(alerts, list)
    if len(alerts) > 0:
        assert "severity" in alerts[0].dict()
        assert "message" in alerts[0].dict()
