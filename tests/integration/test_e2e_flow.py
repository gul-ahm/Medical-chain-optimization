import pytest
import httpx
import asyncio
import json
import uuid
from confluent_kafka import Consumer, KafkaError
from sc_events.registry import TopicRegistry

INVENTORY_SERVICE_URL = "http://localhost:8001/api/v1/inventory"

@pytest.mark.asyncio
async def test_e2e_inventory_to_kafka_flow():
    """
    End-to-End Validation:
    1. Reserve stock in Inventory Service.
    2. Verify 'evt.inventory.reserved' event in Kafka.
    3. Deduct stock in Inventory Service.
    4. Verify 'evt.inventory.deducted' event in Kafka.
    """
    correlation_id = str(uuid.uuid4())
    idempotency_key = str(uuid.uuid4())
    sku = "SKU-PROD-001"
    warehouse_id = "WH-ALPHA"
    qty = 10

    async with httpx.AsyncClient() as client:
        # 1. Reserve Stock
        reserve_resp = await client.post(
            f"{INVENTORY_SERVICE_URL}/reserve",
            json={"sku": sku, "warehouse_id": warehouse_id, "quantity": qty},
            headers={
                "X-Correlation-ID": correlation_id,
                "X-Idempotency-Key": idempotency_key
            }
        )
        assert reserve_resp.status_code == 200, f"Reserve failed: {reserve_resp.text}"
        reservation_id = reserve_resp.json()["data"]["reservation_id"]
        assert reservation_id is not None

        # 2. Verify Kafka Event (Reserved)
        event_reserved = await consume_one_event(TopicRegistry.INVENTORY_RESERVED, correlation_id)
        assert event_reserved is not None
        assert event_reserved["payload"]["sku"] == sku
        assert event_reserved["payload"]["reservation_id"] == reservation_id

        # 3. Deduct Stock
        idempotency_key_2 = str(uuid.uuid4())
        deduct_resp = await client.post(
            f"{INVENTORY_SERVICE_URL}/deduct",
            json={"reservation_id": reservation_id},
            headers={
                "X-Correlation-ID": correlation_id,
                "X-Idempotency-Key": idempotency_key_2
            }
        )
        assert deduct_resp.status_code == 200, f"Deduct failed: {deduct_resp.text}"

        # 4. Verify Kafka Event (Deducted)
        event_deducted = await consume_one_event(TopicRegistry.INVENTORY_DEDUCTED, correlation_id)
        assert event_deducted is not None
        assert event_deducted["payload"]["sku"] == sku
        assert event_deducted["payload"]["deducted_quantity"] == qty

async def consume_one_event(topic: str, correlation_id: str, timeout=20.0):
    """Helper to consume a single event with a matching correlation_id."""
    conf = {
        'bootstrap.servers': 'localhost:9092',
        'group.id': f'test-group-{uuid.uuid4()}',
        'auto.offset.reset': 'earliest'
    }
    consumer = Consumer(conf)
    consumer.subscribe([topic])

    start_time = asyncio.get_event_loop().time()
    try:
        while (asyncio.get_event_loop().time() - start_time) < timeout:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    break
            
            payload = json.loads(msg.value().decode('utf-8'))
            print(f"Consumed message: {payload.get('metadata', {}).get('event_type')} corr={payload.get('metadata', {}).get('correlation_id')}")
            if payload.get("metadata", {}).get("correlation_id") == correlation_id:
                return payload
            
            await asyncio.sleep(0.1)
    finally:
        consumer.close()
    return None
