import asyncio
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from api.routers import auth, approvals
from application.kafka_handlers import GovernanceEventHandler
from application.approval_engine import ApprovalEngine

# We assume sc_events is in PYTHONPATH
from sc_events.consumer import BaseConsumerWorker
from sc_events.producer import AsyncKafkaProducer

# Observability SDK
from sc_observability.logging.logger import setup_logger
from sc_observability.metrics.prometheus import MetricsMiddleware, metrics_endpoint
from sc_observability.tracing.otel import setup_tracing

logger = setup_logger("governance-service")

consumer_worker = BaseConsumerWorker(group_id="governance-interceptor")
handler = GovernanceEventHandler(ApprovalEngine(AsyncKafkaProducer()))

from sc_events.registry import TopicRegistry

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Boot Kafka Consumer to intercept raw optimizations before orchestration
    logger.info("Starting Governance Interceptor...")
    task = asyncio.create_task(
        consumer_worker.start(TopicRegistry.OPTIMIZATION_GENERATED, handler.handle_optimization_generated)
    )
    yield
    logger.info("Shutting down Governance Interceptor...")
    consumer_worker.stop()
    await task

app = FastAPI(
    title="Governance Service",
    description="Domain-Driven RBAC and Approval Engine",
    version="1.0.0",
    lifespan=lifespan
)

# Setup Tracing
setup_tracing("governance-service", app)

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

app.include_router(auth.router)
app.include_router(approvals.router)

@app.get("/metrics")
async def metrics():
    return metrics_endpoint()

@app.get("/health/readiness")
async def readiness():
    return {"status": "ok", "service": "governance"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
