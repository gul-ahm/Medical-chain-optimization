import asyncio
import os
import sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(root)
sys.path.append(os.path.join(root, "services", "inventory-service", "src"))
sys.path.append(os.path.join(root, "packages", "sc_db"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from domain.models import WarehouseStock

POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql+asyncpg://admin:password@localhost:5432/supply_chain")

async def seed_stock():
    engine = create_async_engine(POSTGRES_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if already seeded
        from sqlalchemy import select
        result = await session.execute(select(WarehouseStock))
        if result.scalars().first():
            print("Stock already seeded.")
            return

        print("Seeding stock...")
        stocks = [
            WarehouseStock(sku="SKU-PROD-001", warehouse_id="WH-ALPHA", quantity_on_hand=1000),
            WarehouseStock(sku="SKU-PROD-002", warehouse_id="WH-ALPHA", quantity_on_hand=500),
            WarehouseStock(sku="SKU-PROD-001", warehouse_id="WH-BETA", quantity_on_hand=300),
        ]
        session.add_all(stocks)
        await session.commit()
        print("Stock seeded successfully.")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_stock())
