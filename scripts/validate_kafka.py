import asyncio
from confluent_kafka import Consumer, KafkaError
import json
import os

def validate():
    conf = {
        'bootstrap.servers': os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
        'group.id': 'validation-consumer',
        'auto.offset.reset': 'earliest'
    }

    consumer = Consumer(conf)
    consumer.subscribe(['medical-events'])

    print("--- KAFKA EVENT VALIDATION ---")
    print("Listening for events on 'medical-events'...")

    count = 0
    try:
        # Poll for a few seconds
        for _ in range(10):
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(msg.error())
                    break

            payload = json.loads(msg.value().decode('utf-8'))
            print(f"Captured Event: {payload.get('metadata', {}).get('event_type')}")
            print(f"Payload Sample: {json.dumps(payload.get('payload', {}), indent=2)}")
            count += 1
            if count >= 3:
                break
    finally:
        consumer.close()
    
    if count == 0:
        print("No events found in topic.")

if __name__ == "__main__":
    validate()
