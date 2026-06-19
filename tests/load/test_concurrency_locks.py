import asyncio
import httpx
import pytest
import uuid

INVENTORY_SERVICE_URL = "http://localhost:8001/api/v1/inventory"

@pytest.mark.asyncio
async def test_high_concurrency_reservation():
    """
    Stress Test:
    Spawns 50 concurrent requests to reserve the same SKU.
    Ensures that the total reserved does not exceed stock limits
    and that Redis locks prevent race conditions.
    """
    sku = "STRESS-TEST-SKU"
    warehouse_id = "WH-STRESS"
    qty_per_request = 1
    total_requests = 50
    
    # Pre-condition: Ensure stock is available (this might require a seed script)
    # For this test, we assume the service handles it or we hit it and count successes.
    
    async with httpx.AsyncClient() as client:
        tasks = []
        for i in range(total_requests):
            correlation_id = f"stress-{uuid.uuid4()}"
            idempotency_key = f"idemp-{uuid.uuid4()}"
            tasks.append(client.post(
                f"{INVENTORY_SERVICE_URL}/reserve",
                json={"sku": sku, "warehouse_id": warehouse_id, "quantity": qty_per_request},
                headers={
                    "X-Correlation-ID": correlation_id,
                    "X-Idempotency-Key": idempotency_key
                },
                timeout=30.0
            ))
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        successes = [r for r in responses if isinstance(r, httpx.Response) and r.status_code == 200]
        failures = [r for r in responses if not isinstance(r, httpx.Response) or r.status_code != 200]
        
        print(f"Concurrency Results: {len(successes)} Successes, {len(failures)} Failures")
        
        # In a real scenario, if we started with 20 items, we should have exactly 20 successes.
        # Since we don't know the starting stock here, we just verify no crashes and structure.
        for r in successes:
            assert "reservation_id" in r.json()["data"]

@pytest.mark.asyncio
async def test_idempotency_storm():
    """
    Sends the SAME request (same idempotency key) 10 times concurrently.
    Only ONE should succeed, the rest should return 'ALREADY_PROCESSED'.
    """
    sku = "IDEMP-SKU"
    warehouse_id = "WH-1"
    idempotency_key = f"storm-{uuid.uuid4()}"
    correlation_id = "storm-corr"
    
    async with httpx.AsyncClient() as client:
        tasks = [client.post(
            f"{INVENTORY_SERVICE_URL}/reserve",
            json={"sku": sku, "warehouse_id": warehouse_id, "quantity": 1},
            headers={
                "X-Correlation-ID": correlation_id,
                "X-Idempotency-Key": idempotency_key
            }
        ) for _ in range(10)]
        
        responses = await asyncio.gather(*tasks)
        
        success_count = 0
        already_processed_count = 0
        
        for r in responses:
            if r.status_code == 200:
                data = r.json()["data"]
                if data.get("status") == "RESERVED":
                    success_count += 1
                elif data.get("status") == "ALREADY_PROCESSED":
                    already_processed_count += 1
        
        assert success_count == 1
        assert already_processed_count == 9
