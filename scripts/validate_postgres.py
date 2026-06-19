import asyncio
from sqlalchemy import select, func
from sc_db.session import async_session
from sc_db.models import Medicine, PharmaVendor, Hospital, DemandHistory, WarehouseStock

async def validate():
    async with async_session() as session:
        print("--- POSTGRES RUNTIME VALIDATION ---")
        
        # Row counts
        for model in [Medicine, PharmaVendor, Hospital, DemandHistory, WarehouseStock]:
            count = await session.scalar(select(func.count()).select_from(model))
            print(f"Table {model.__tablename__}: {count} rows")
            
        # Sample Medicine
        result = await session.execute(select(Medicine).limit(3))
        medicines = result.scalars().all()
        print("\nSample Medicines:")
        for m in medicines:
            print(f"- {m.medicine_name} ({m.drug_class}): {m.units_in_stock} units, Expiry: {m.expiry_date}")
            
        # Sample Hospital
        result = await session.execute(select(Hospital).limit(3))
        hospitals = result.scalars().all()
        print("\nSample Hospitals:")
        for h in hospitals:
            print(f"- {h.hospital_name} in {h.city} ({h.hospital_type})")

if __name__ == "__main__":
    asyncio.run(validate())
