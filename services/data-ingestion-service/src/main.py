import asyncio
import os
from pathlib import Path
from fastapi import FastAPI, BackgroundTasks
from contextlib import asynccontextmanager

from sc_events.producer import AsyncKafkaProducer
from sc_observability.logging.logger import setup_logger
from application.ingestion_engine import IngestionEngine

logger = setup_logger("data-ingestion-service")

# Configuration
DATA_ROOT = Path(os.getenv("DATA_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "NorthwindData"))))

producer = AsyncKafkaProducer()
engine = IngestionEngine(DATA_ROOT, producer)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Data Ingestion Service Starting...")
    # Initial ingestion on startup in background
    asyncio.create_task(engine.run_full_ingestion())
    yield
    logger.info("Data Ingestion Service Shutting Down...")

app = FastAPI(
    title="Medical Data Ingestion Service",
    description="Engine for converting Northwind datasets to Medical Intelligence",
    version="1.0.0",
    lifespan=lifespan
)

@app.post("/ingest/full")
async def trigger_full_ingestion(background_tasks: BackgroundTasks):
    """Triggers a full re-ingestion of all datasets."""
    background_tasks.add_task(engine.run_full_ingestion)
    return {"message": "Full ingestion cycle triggered in background"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "data-ingestion-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8016)
