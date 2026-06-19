import asyncio
import os
import sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(root)

from sqlalchemy.ext.asyncio import create_async_engine

# Import all models to register with Base
# Inventory
sys.path.append(os.path.join(root, "services", "inventory-service", "src"))
from domain.models import Base as InventoryBase
sys.path.pop()

# Forecasting
sys.path.append(os.path.join(root, "services", "forecasting-service", "src"))
from domain.models import Base as ForecastingBase
sys.path.pop()

# Optimization (no models found earlier, but check)
# Governance
sys.path.append(os.path.join(root, "services", "governance-service", "src"))
from domain.models import Base as GovernanceBase
sys.path.pop()

POSTGRES_URL = os.getenv("POSTGRES_URL", "sqlite+aiosqlite:///E:/power bi/supply_chain.db")

async def init_db():
    print(f"Connecting to {POSTGRES_URL}...")
    engine = create_async_engine(POSTGRES_URL)
    
    async with engine.begin() as conn:
        print("Creating tables for all domains...")
        await conn.run_sync(InventoryBase.metadata.create_all)
        await conn.run_sync(ForecastingBase.metadata.create_all)
        await conn.run_sync(GovernanceBase.metadata.create_all)
        print("All tables created successfully.")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())
