import os
import sys
import asyncio
from pathlib import Path

# Add project layers and packages to path
ROOT = r"E:\power bi"
sys.path.extend([
    os.path.join(ROOT, "packages", "sc_events"),
    os.path.join(ROOT, "packages", "sc_db"),
    os.path.join(ROOT, "packages", "sc_auth"),
    os.path.join(ROOT, "packages", "sc_schemas"),
    os.path.join(ROOT, "packages", "sc_observability"),
    os.path.join(ROOT, "services", "data-ingestion-service", "src")
])

# Set environment variable POSTGRES_URL to SQLite so everything uses SQLite
os.environ["POSTGRES_URL"] = "sqlite+aiosqlite:///E:/power bi/supply_chain.db"
os.environ["DATA_ROOT"] = r"E:\power bi\NorthwindData"

from sc_events.producer import AsyncKafkaProducer
from application.ingestion_engine import IngestionEngine

async def run():
    print("Initializing dummy/mock producer...")
    producer = AsyncKafkaProducer()
    
    print("Initializing IngestionEngine...")
    data_root = Path(r"E:\power bi\NorthwindData")
    engine = IngestionEngine(data_root, producer)
    
    print("Running Full Ingestion on SQLite Database...")
    await engine.run_full_ingestion()
    print("Ingestion Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(run())
