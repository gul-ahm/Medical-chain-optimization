import json
import logging
import asyncio
from typing import Callable, Awaitable, Any, Optional
import os
from confluent_kafka import Consumer, KafkaError, KafkaException
from tenacity import retry, wait_exponential, stop_after_attempt
from sc_events.registry import TopicRegistry
from sc_observability.metrics.prometheus import KAFKA_MESSAGES_CONSUMED

logger = logging.getLogger(__name__)

class BaseConsumerWorker:
    def __init__(self, group_id: str, bootstrap_servers: Optional[str] = None):
        self.bootstrap_servers = bootstrap_servers or os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        self.conf = {
            'bootstrap.servers': self.bootstrap_servers,
            'group.id': group_id,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False  # Strict explicit commits only
        }
        self.consumer = Consumer(self.conf)
        self.running = False
        
        # DLQ Producer
        from sc_events.producer import AsyncKafkaProducer
        self.dlq_producer = AsyncKafkaProducer(bootstrap_servers)

    @retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(3))
    async def _process_with_retries(self, handler: Callable[[Any], Awaitable[None]], payload: dict):
        """Execute the handler with exponential backoff retries."""
        await handler(payload)

    async def start(self, topic: str, handler: Callable[[Any], Awaitable[None]]):
        self.consumer.subscribe([topic])
        self.running = True
        logger.info(f"Consumer started for topic: {topic}")

        try:
            while self.running:
                # Poll with a very short timeout to avoid blocking the event loop
                msg = self.consumer.poll(timeout=0.1)
                await asyncio.sleep(0.05)

                if msg is None:
                    continue
                
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        logger.error(f"Kafka error: {msg.error()}")
                        raise KafkaException(msg.error())

                # Process message
                try:
                    payload = json.loads(msg.value().decode('utf-8'))
                    logger.info(f"Received message: {payload.get('metadata', {}).get('event_id')}")
                    
                    # Record Metrics
                    KAFKA_MESSAGES_CONSUMED.labels(topic=topic).inc()

                    # Process with retries
                    await self._process_with_retries(handler, payload)
                    
                    # Commit ONLY after successful processing
                    self.consumer.commit(asynchronous=False)
                    
                except Exception as e:
                    logger.error(f"Exhausted retries for message. Routing to DLQ. Error: {str(e)}")
                    # Route to DLQ
                    dlq_topic = TopicRegistry.get_dlq_for_topic(topic)
                    # We inject a simplified error payload to DLQ for this demo
                    dlq_payload = {"failed_payload": payload, "error": str(e)}
                    # For a robust implementation, wrap in an EventEnvelope. Handled raw for simplicity here.
                    from sc_events.producer import AsyncKafkaProducer
                    p = AsyncKafkaProducer()
                    # Just an unmanaged push to DLQ
                    p.producer.produce(topic=dlq_topic, key=msg.key(), value=json.dumps(dlq_payload))
                    p.flush()
                    # Commit offset so we don't infinitely process poison pill
                    self.consumer.commit(asynchronous=False)
                    
        finally:
            self.consumer.close()

    def stop(self):
        self.running = False
