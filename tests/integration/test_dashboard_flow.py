import pytest
import httpx
import asyncio
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api/v1"

@pytest.mark.asyncio
async def test_auth_login_flow():
    """
    Validates the enterprise authentication and token generation flow.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/auth/login",
            json={"username": "admin", "password": "admin123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data["data"]
        assert "roles" in data["data"]

@pytest.mark.asyncio
async def test_inventory_overview_integrity():
    """
    Validates the inventory intelligence overview contract and data consistency.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/inventory/overview")
        assert response.status_code == 200
        data = response.json()
        assert "total_inventory" in data["data"]["kpis"]
        assert isinstance(data["data"]["warehouse_utilization"], list)

@pytest.mark.asyncio
async def test_forecasting_inference_flow():
    """
    Validates the ML-driven demand forecasting inference API.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/forecasting/kpis")
        assert response.status_code == 200
        data = response.json()
        assert "avg_accuracy" in data["data"]

@pytest.mark.asyncio
async def test_optimization_recommendations():
    """
    Validates the prescriptive optimization engine's recommendation output.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/optimization/transfers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["data"], list)

@pytest.mark.asyncio
async def test_orchestration_agent_health():
    """
    Validates the autonomous agent fleet monitoring and status API.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/orchestration/agents")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) > 0
        assert "status" in data["data"][0]

@pytest.mark.asyncio
async def test_sse_stream_connectivity():
    """
    Validates the SSE (Server-Sent Events) streaming connection and initial frame.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        async with client.stream("GET", f"{BASE_URL}/stream/dashboard") as response:
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/event-stream"
            
            # Read first chunk to verify connection confirmation
            async for line in response.aiter_lines():
                if line.startswith("data:"):
                    assert "status" in line
                    break

@pytest.mark.asyncio
async def test_ml_inference_gateway():
    """
    Validates the real-time ML inference routes for risk and dead stock.
    """
    async with httpx.AsyncClient() as client:
        # Test Supplier Risk Inference
        risk_resp = await client.post(
            f"{BASE_URL}/ml/supplier-risk",
            json={"historical_delay_rate": 0.12, "avg_lead_time": 5.0, "lead_time_variance": 1.2, "order_volume": 500, "geographic_risk_score": 0.3}
        )
        assert risk_resp.status_code == 200
        assert "risk_category" in risk_resp.json()["data"]
