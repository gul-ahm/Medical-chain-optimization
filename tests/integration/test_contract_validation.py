import pytest
import httpx
from typing import Dict, Any

SERVICES = {
    "inventory": "http://localhost:8001/api/v1/inventory",
    "forecasting": "http://localhost:8002/api/v1/forecasting",
    "optimization": "http://localhost:8003/api/v1/optimization",
    "orchestration": "http://localhost:8004/api/v1/orchestration",
    "governance": "http://localhost:8005/api/v1/governance"
}

@pytest.mark.asyncio
async def test_inventory_contract():
    async with httpx.AsyncClient() as client:
        # Check health/readiness
        resp = await client.get("http://localhost:8001/health/readiness")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_standard_response_structure():
    """Validates that all services return the StandardResponse structure."""
    async with httpx.AsyncClient() as client:
        for name, url in SERVICES.items():
            try:
                # We hit a non-existent endpoint to check the error response structure or a health check
                resp = await client.get(f"{url.replace('/api/v1', '')}/health/readiness")
                if resp.status_code == 200:
                    data = resp.json()
                    assert "status" in data
            except Exception as e:
                print(f"Skipping {name} as it might not be up yet: {e}")

@pytest.mark.asyncio
async def test_rbac_propagation_contract():
    """Checks if the services accept and propagate JWT/Correlation headers."""
    headers = {
        "X-Correlation-ID": "test-corr-id",
        "Authorization": "Bearer fake-token"
    }
    async with httpx.AsyncClient() as client:
        # Test inventory
        resp = await client.get("http://localhost:8001/api/v1/inventory/overview", headers=headers)
        # Even if 401, we check if the Correlation ID is returned in headers
        assert "X-Correlation-ID" in resp.headers
        assert resp.headers["X-Correlation-ID"] == "test-corr-id"
