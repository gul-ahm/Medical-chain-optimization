from confluent_kafka.admin import AdminClient
import os

def check_kafka():
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    print(f"Connecting to Kafka at {bootstrap_servers}...")
    admin = AdminClient({"bootstrap.servers": bootstrap_servers})
    
    try:
        topics = admin.list_topics(timeout=10).topics
        print("Kafka Topics:")
        for topic in topics:
            print(f" - {topic}")
    except Exception as e:
        print(f"Failed to list topics: {e}")

if __name__ == "__main__":
    check_kafka()
