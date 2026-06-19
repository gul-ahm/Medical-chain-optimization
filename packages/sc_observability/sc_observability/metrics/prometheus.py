from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response
import time

# Common metrics
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)
HTTP_REQUEST_LATENCY = Histogram(
    "http_request_latency_seconds", "HTTP request latency", ["endpoint"]
)
KAFKA_MESSAGES_PRODUCED = Counter(
    "kafka_messages_produced_total", "Total Kafka messages produced", ["topic"]
)
KAFKA_MESSAGES_CONSUMED = Counter(
    "kafka_messages_consumed_total", "Total Kafka messages consumed", ["topic"]
)

def metrics_endpoint():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

from starlette.middleware.base import BaseHTTPMiddleware

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()
        response = await call_next(request)
        latency = time.time() - start_time
        
        endpoint = request.url.path
        HTTP_REQUESTS_TOTAL.labels(
            method=request.method, endpoint=endpoint, status=response.status_code
        ).inc()
        HTTP_REQUEST_LATENCY.labels(endpoint=endpoint).observe(latency)
        
        return response
