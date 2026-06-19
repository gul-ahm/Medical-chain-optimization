import asyncio
import logging
import sys
import os

# Ensure packages are in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'packages', 'sc_events')))

from sc_events.producer import AsyncKafkaProducer
from sc_events.consumer import BaseConsumerWorker
from sc_events.registry import TopicRegistry
from sc_events.envelope import EventEnvelope, EventMetadata

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("test-infra")

# Mock handler for the consumer
async def handle_inventory_deducted(payload: dict):
    logger.info(f"HANDLER EXECUTED: Processing payload: {payload}")
    # Simulate work
    await asyncio.sleep(0.5)
    logger.info("HANDLER SUCCESS: Inventory Deduction logic complete.")

async def main():
    topic = TopicRegistry.INVENTORY_DEDUCTED
    logger.info(f"Starting test for topic: {topic}")

    # Initialize SDKs
    producer = AsyncKafkaProducer()
    consumer = BaseConsumerWorker(group_id="test-inventory-group")

    # Start consumer in background task
    consumer_task = asyncio.create_task(consumer.start(topic, handle_inventory_deducted))

    # Wait for consumer to boot
    await asyncio.sleep(2)

    # Create typed envelope
    envelope = EventEnvelope(
        metadata=EventMetadata(
            event_type="InventoryDeducted",
            correlation_id="test-corr-1234"
        ),
        payload={
            "sku": "SKU-999",
            "quantity": 10,
            "warehouse_id": "WH-NYC-01"
        }
    )

    # Publish
    logger.info(f"Publishing event {envelope.metadata.event_id}...")
    success = await producer.publish(topic, envelope)
    producer.flush()
    
    if success:
        logger.info("Publish succeeded!")
    else:
        logger.error("Publish failed!")

    # Wait for consumer to process
    await asyncio.sleep(3)
    
    # Shutdown
    logger.info("Shutting down...")
    consumer.stop()
    await consumer_task

if __name__ == "__main__":
    asyncio.run(main())
