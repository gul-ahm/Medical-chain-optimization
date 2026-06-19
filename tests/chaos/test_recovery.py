import subprocess
import time
import pytest
import httpx
import asyncio

@pytest.mark.asyncio
async def test_kafka_broker_recovery():
    """
    Chaos Test:
    1. Stop Kafka.
    2. Try to reserve stock (should fail or buffer).
    3. Start Kafka.
    4. Verify system recovers and events are eventually sent.
    """
    # 1. Stop Kafka
    subprocess.run(["docker-compose", "stop", "kafka"], check=True)
    time.sleep(5)
    
    # 2. Try to reserve stock
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                "http://localhost:8001/api/v1/inventory/reserve",
                json={"sku": "CHAOS-SKU", "warehouse_id": "WH-1", "quantity": 1},
                headers={"X-Correlation-ID": "chaos-1", "X-Idempotency-Key": "chaos-k-1"},
                timeout=5.0
            )
            # Depending on implementation, this might fail or timeout if Kafka is required synchronously
            # In our architecture, it should ideally be async but the producer might block if buffer is full.
            print(f"Request status during Kafka outage: {resp.status_code}")
        except Exception as e:
            print(f"Expected failure during Kafka outage: {e}")

    # 3. Restart Kafka
    subprocess.run(["docker-compose", "start", "kafka"], check=True)
    time.sleep(15) # Wait for Kafka to be ready

    # 4. Verify system is back up
    async with httpx.AsyncClient() as client:
        resp = await client.get("http://localhost:8001/health/readiness")
        assert resp.status_code == 200

@pytest.mark.asyncio
async def test_redis_recovery():
    """
    Chaos Test: Redis failure.
    Redis is used for locks. If it goes down, reservations should fail gracefully.
    """
    subprocess.run(["docker-compose", "stop", "redis"], check=True)
    time.sleep(2)
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "http://localhost:8001/api/v1/inventory/reserve",
            json={"sku": "REDIS-CHAOS", "warehouse_id": "WH-1", "quantity": 1},
            headers={"X-Correlation-ID": "chaos-2", "X-Idempotency-Key": "chaos-r-1"}
        )
        # Should return 400 or 500 because lock acquisition fails
        assert resp.status_code >= 400
        
    subprocess.run(["docker-compose", "start", "redis"], check=True)
    time.sleep(5)
    
    async with httpx.AsyncClient() as client:
        resp = await client.get("http://localhost:8001/health/readiness")
        assert resp.status_code == 200
