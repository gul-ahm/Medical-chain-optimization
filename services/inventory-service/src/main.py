import asyncio
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from api.routers import inventory, stream
from application.broadcaster import broadcaster

# We assume sc_events is in PYTHONPATH
from sc_events.consumer import BaseConsumerWorker
from sc_events.registry import TopicRegistry

# Observability SDK
from sc_observability.logging.logger import setup_logger
from sc_observability.metrics.prometheus import MetricsMiddleware, metrics_endpoint
from sc_observability.tracing.otel import setup_tracing

from application.kafka_handlers import InventoryCommandHandler
from application.services import InventoryApplicationService
from infrastructure.redis_locks import RedisLockManager
from sc_db.session import async_session
from sc_events.producer import AsyncKafkaProducer

logger = setup_logger("inventory-service")

sse_consumer = BaseConsumerWorker(group_id="inventory-sse-broadcaster")
cmd_consumer = BaseConsumerWorker(group_id="inventory-command-processor")

# Setup Service & Handler
redis_manager = RedisLockManager()
producer = AsyncKafkaProducer()

async def bridge_kafka_to_sse(payload: dict):
    event_type = payload.get("metadata", {}).get("event_type", "UnknownEvent")
    await broadcaster.publish(event_type, payload)

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis_manager = redis_manager
    app.state.producer = producer
    
    logger.info("Starting Background Consumers...")
    
    # 1. SSE Bridge (Events)
    sse_task = asyncio.create_task(sse_consumer.start(TopicRegistry.INVENTORY_DEDUCTED, bridge_kafka_to_sse))
    
    # 2. Saga Command Processor
    # For background handlers, we need a session. 
    # We can create a dedicated session for the handler.
    async def run_cmd_processor():
        async with async_session() as session:
            service = InventoryApplicationService(session, redis_manager, producer)
            handler = InventoryCommandHandler(service)
            await cmd_consumer.start(TopicRegistry.CMD_RESERVE_STOCK, handler.handle_reserve)
            
    cmd_task = asyncio.create_task(run_cmd_processor())
    
    yield
    
    logger.info("Shutting down Background Consumers...")
    sse_consumer.stop()
    cmd_consumer.stop()
    await asyncio.gather(sse_task, cmd_task, return_exceptions=True)

app = FastAPI(
    title="Inventory Service",
    description="Domain-Driven Inventory Microservice",
    version="1.0.0",
    lifespan=lifespan
)

# Setup Tracing
setup_tracing("inventory-service", app)

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

# Standard Endpoints
app.include_router(inventory.router)
app.include_router(stream.router)

@app.get("/metrics")
async def metrics():
    return metrics_endpoint()

@app.get("/health/readiness")
async def readiness():
    return {"status": "ok", "service": "inventory"}

@app.get("/health/liveness")
async def liveness():
    return {"status": "alive"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

