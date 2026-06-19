import json
import logging
import asyncio
from typing import Any, Dict, Optional
import os
from confluent_kafka import Producer
from sc_events.envelope import EventEnvelope
from sc_observability.metrics.prometheus import KAFKA_MESSAGES_PRODUCED

logger = logging.getLogger(__name__)

class AsyncKafkaProducer:
    def __init__(self, bootstrap_servers: Optional[str] = None):
        self.bootstrap_servers = bootstrap_servers or os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        self.conf = {
            'bootstrap.servers': self.bootstrap_servers,
            'client.id': 'sc-enterprise-producer',
            'enable.idempotence': True,
            'acks': 'all',
            'retries': 5
        }
        self.producer = Producer(self.conf)

    def _delivery_report(self, err, msg):
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}]")

    async def publish(self, topic: str, envelope: EventEnvelope) -> bool:
        """Asynchronously publish a typed EventEnvelope."""
        # Convert envelope to dict, ensuring datetime serialization
        payload = envelope.dict()
        # Serialize datetime fields properly
        payload_str = json.dumps(payload, default=str)
        
        try:
            self.producer.produce(
                topic=topic,
                key=envelope.metadata.event_id,
                value=payload_str,
                callback=self._delivery_report
            )
            # Yield to event loop, then poll to trigger callbacks
            await asyncio.sleep(0)
            self.producer.poll(0)
            
            # Record Metrics
            KAFKA_MESSAGES_PRODUCED.labels(topic=topic).inc()
            
            return True
        except Exception as e:
            logger.error(f"Failed to publish to {topic}: {str(e)}")
            return False

    def flush(self):
        self.producer.flush()
