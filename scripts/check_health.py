import httpx
import asyncio

SERVICES = {
    "inventory": "http://localhost:8001/health/readiness",
    "forecasting": "http://localhost:8002/health/readiness",
    "optimization": "http://localhost:8003/health/readiness",
    "orchestration": "http://localhost:8004/health/readiness",
    "governance": "http://localhost:8005/health/readiness"
}

async def check_health():
    async with httpx.AsyncClient() as client:
        for name, url in SERVICES.items():
            try:
                resp = await client.get(url, timeout=5.0)
                print(f"{name}: {resp.status_code} - {resp.json()}")
            except Exception as e:
                print(f"{name}: FAILED - {e}")

if __name__ == "__main__":
    asyncio.run(check_health())
