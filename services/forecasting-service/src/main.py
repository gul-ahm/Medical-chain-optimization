import asyncio
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from api.routers import forecasts
from infrastructure.feature_store import FeatureStore
from application.kafka_handlers import InventoryEventHandler

# We assume sc_events is in PYTHONPATH
from sc_events.consumer import BaseConsumerWorker
from sc_events.registry import TopicRegistry

# Observability SDK
from sc_observability.logging.logger import setup_logger
from sc_observability.metrics.prometheus import MetricsMiddleware, metrics_endpoint
from sc_observability.tracing.otel import setup_tracing

logger = setup_logger("forecasting-service")

consumer_worker = BaseConsumerWorker(group_id="forecasting-feature-ingestion")
feature_store = FeatureStore()
inventory_handler = InventoryEventHandler(feature_store)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Boot Kafka Consumer to listen to Inventory Deductions
    logger.info("Starting Forecasting Feature Ingestion Consumer...")
    task = asyncio.create_task(
        consumer_worker.start(TopicRegistry.INVENTORY_DEDUCTED, inventory_handler.handle_deducted)
    )
    yield
    logger.info("Shutting down Feature Ingestion Consumer...")
    consumer_worker.stop()
    await task

app = FastAPI(
    title="Forecasting Service",
    description="Domain-Driven Forecasting & MLOps Microservice",
    version="1.0.0",
    lifespan=lifespan
)

# Setup Tracing
setup_tracing("forecasting-service", app)

# Setup Metrics
app.add_middleware(MetricsMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def correlation_middleware(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
    request.state.correlation_id = correlation_id
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Correlation-ID"] = correlation_id
    return response

app.include_router(forecasts.router)

@app.get("/metrics")
async def metrics():
    return metrics_endpoint()

@app.get("/health/readiness")
async def readiness():
    return {"status": "ok", "service": "forecasting"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
