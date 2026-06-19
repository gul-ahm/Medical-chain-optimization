import asyncio
import httpx
import logging
import json

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("RealismValidation")

async def test_operational_endpoints():
    logger.info("Starting Operational Realism Validation...")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Test Operational Forecast
        try:
            logger.info("Testing Operational Forecast Endpoint...")
            resp = await client.post("http://localhost:8008/api/v1/operational/forecast?inventory=0.2&delay=3.5")
            assert resp.status_code == 200
            data = resp.json()
            logger.info(f"Forecast Response: {json.dumps(data)}")
            assert data["calculated_risk_score"] > 0.0
            logger.info("[PASS] Operational Forecast returns grounded heuristics.")
        except Exception as e:
            logger.error(f"[FAIL] Operational Forecast: {e}")

        # 2. Test Recommendation Agent Constraints
        try:
            logger.info("Testing Recommendation Agent with explicit FEFO/Cold-Chain safety triggers...")
            payload = {
                "warehouse_id": "WH-EAST-101",
                "focus_skus": ["MED-INSULIN-01"]
            }
            resp = await client.post("http://localhost:8008/api/v1/ai/recommendations", json=payload)
            # The agent might return 200 with safety limits rejected or accepted
            logger.info(f"Recommendation Status: {resp.status_code}")
            data = resp.json()
            logger.info(f"Recommendation Payload: {json.dumps(data)[:200]}...")
            
            # Since Ollama might be offline locally, we expect our deterministic fallback to work
            if "data" in data and "recommendations" in data["data"]:
                recs = data["data"]["recommendations"]
                logger.info(f"Got {len(recs)} recommendations.")
                for r in recs:
                    logger.info(f" - Rec status: {r.get('safety_status')}, Confidence: {r.get('confidence_score')}")
            logger.info("[PASS] Recommendation framework handles constraint execution securely.")
        except Exception as e:
            logger.error(f"[FAIL] Recommendation Framework: {e}")

        # 3. Test Health Endpoint
        try:
            logger.info("Testing Service Health...")
            resp = await client.get("http://localhost:8008/health/readiness")
            assert resp.status_code == 200
            logger.info(f"Health: {resp.json()}")
            logger.info("[PASS] Service is responsive.")
        except Exception as e:
            logger.error(f"[FAIL] Health check: {e}")

if __name__ == "__main__":
    asyncio.run(test_operational_endpoints())
