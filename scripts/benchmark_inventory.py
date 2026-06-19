import asyncio
import httpx
import time
import statistics

INVENTORY_URL = "http://localhost:8001/api/v1/inventory/reserve"

async def benchmark_reserve(num_requests=100):
    latencies = []
    async with httpx.AsyncClient() as client:
        for i in range(num_requests):
            payload = {
                "sku": f"SKU-{i % 10}",
                "warehouse_id": "WH-1",
                "quantity": 1
            }
            headers = {
                "X-Correlation-ID": f"bench-{i}",
                "X-Idempotency-Key": f"bench-key-{i}"
            }
            
            start = time.perf_counter()
            try:
                resp = await client.post(INVENTORY_URL, json=payload, headers=headers, timeout=10.0)
                latencies.append(time.perf_counter() - start)
            except Exception as e:
                print(f"Request {i} failed: {e}")
    
    if latencies:
        print(f"Benchmark Results for {num_requests} requests:")
        print(f"Mean Latency: {statistics.mean(latencies)*1000:.2f}ms")
        print(f"Median Latency: {statistics.median(latencies)*1000:.2f}ms")
        print(f"P95 Latency: {statistics.quantiles(latencies, n=20)[18]*1000:.2f}ms")
        print(f"Throughput: {len(latencies)/sum(latencies):.2f} req/s")

if __name__ == "__main__":
    asyncio.run(benchmark_reserve())
