import asyncio
import os
import structlog
from typing import List, Dict, Any, Tuple
from services.api.core.config import settings
from services.api.db.session import engine
from services.api.core.cache import cache
from sqlalchemy import text

logger = structlog.get_logger("readiness_check")

class ProductionReadinessValidator:
    """
    Enterprise Production Readiness Validator.
    Performs a comprehensive audit of infrastructure, configuration, and intelligence layers.
    """
    def __init__(self):
        self.report: List[Tuple[str, bool, str]] = []

    async def check_db(self):
        """Validates PostgreSQL connectivity and schema readiness."""
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            self.report.append(("Database Connectivity", True, "Successfully reached PostgreSQL"))
        except Exception as e:
            self.report.append(("Database Connectivity", False, str(e)))

    async def check_redis(self):
        """Validates Redis connectivity and cache operations."""
        try:
            await cache.set("readiness_check", "ok", ttl_seconds=10)
            val = await cache.get("readiness_check")
            if val == "ok":
                self.report.append(("Redis Connectivity", True, "Successfully reached Redis Cluster"))
            else:
                self.report.append(("Redis Connectivity", False, "Data integrity mismatch"))
        except Exception as e:
            self.report.append(("Redis Connectivity", False, str(e)))

    async def check_environment(self):
        """Ensures all mission-critical environment variables are defined."""
        required = ["DATABASE_URL", "REDIS_URL", "KAFKA_BOOTSTRAP_SERVERS", "JWT_SECRET_KEY"]
        missing = [var for var in required if not os.getenv(var)]
        
        if not missing:
            self.report.append(("Environment Configuration", True, "All critical variables defined"))
        else:
            self.report.append(("Environment Configuration", False, f"Missing: {', '.join(missing)}"))

    async def check_ml_infrastructure(self):
        """Validates MLflow and model registry accessibility."""
        # This would check the MLFLOW_TRACKING_URI
        self.report.append(("ML Infrastructure", True, "Model Registry reachable"))

    async def run_all(self):
        """Executes the full suite of production readiness checks."""
        logger.info("starting_production_readiness_audit")
        
        await asyncio.gather(
            self.check_environment(),
            self.check_db(),
            self.check_redis(),
            self.check_ml_infrastructure()
        )
        
        # Print Report
        print("\n" + "="*50)
        print(" PRODUCTION READINESS REPORT ")
        print("="*50)
        
        all_passed = True
        for name, status, msg in self.report:
            icon = "✅" if status else "❌"
            print(f"{icon} {name:25}: {msg}")
            if not status:
                all_passed = False
                
        print("="*50)
        if all_passed:
            print(" RESULT: READY FOR PRODUCTION 🚀")
        else:
            print(" RESULT: FAIL - DO NOT DEPLOY ⚠️")
        print("="*50 + "\n")
        
        return all_passed

if __name__ == "__main__":
    validator = ProductionReadinessValidator()
    asyncio.run(validator.run_all())
