import asyncio
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from api.routers import sagas
from application.kafka_handlers import SagaEventHandler
from application.sagas.transfer_saga import TransferSaga
from infrastructure.state_machine import SagaCache

# We assume sc_events is in PYTHONPATH
from sc_events.consumer import BaseConsumerWorker
from sc_events.producer import AsyncKafkaProducer

# Observability SDK
from sc_observability.logging.logger import setup_logger
from sc_observability.metrics.prometheus import MetricsMiddleware, metrics_endpoint
from sc_observability.tracing.otel import setup_tracing

logger = setup_logger("orchestration-service")

consumer_worker = BaseConsumerWorker(group_id="saga-orchestrator-group")
cache = SagaCache()
producer = AsyncKafkaProducer()
transfer_saga = TransferSaga(cache, producer)
handler = SagaEventHandler(transfer_saga)

from sc_events.registry import TopicRegistry

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Boot Kafka Consumer to listen to choreography events
    logger.info("Starting Saga Choreography Listener...")
    
    # Listen to multiple topics to drive the Saga state machine
    task1 = asyncio.create_task(
        consumer_worker.start(TopicRegistry.OPTIMIZATION_GENERATED, handler.handle_transfer_recommended)
    )
    task2 = asyncio.create_task(
        consumer_worker.start(TopicRegistry.INVENTORY_RESERVED, handler.handle_inventory_reserved)
    )
    # Using a second consumer for failures/dlq to ensure high priority
    task3 = asyncio.create_task(
        consumer_worker.start(TopicRegistry.get_dlq_for_topic(TopicRegistry.INVENTORY_RESERVED), handler.handle_inventory_failed)
    )
    
    yield
    logger.info("Shutting down Saga Listener...")
    consumer_worker.stop()
    await asyncio.gather(task1, task2, task3)

app = FastAPI(
    title="Orchestration Service",
    description="Domain-Driven Distributed Saga Manager",
    version="1.0.0",
    lifespan=lifespan
)

# Setup Tracing
setup_tracing("orchestration-service", app)

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

app.include_router(sagas.router)

@app.get("/metrics")
async def metrics():
    return metrics_endpoint()

@app.get("/health/readiness")
async def readiness():
    return {"status": "ok", "service": "orchestration"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
