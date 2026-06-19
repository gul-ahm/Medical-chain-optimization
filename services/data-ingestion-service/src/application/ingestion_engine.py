import json
import random
import asyncio
import uuid
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import select

from sc_db.session import async_session
from sc_db.models import Medicine, PharmaVendor, Hospital, MedicineOrder, MedicineOrderDetail, DemandHistory, MedicineShipment, WarehouseStock
from sc_events.producer import AsyncKafkaProducer
from application.medical_transformer import MedicalTransformer
from infrastructure.redis_features import RedisFeatureStore
from sc_observability.logging.logger import setup_logger

logger = setup_logger("data-ingestion-service")

class IngestionEngine:
    def __init__(self, data_root: Path, producer: AsyncKafkaProducer):
        self.data_root = data_root
        self.producer = producer
        self.transformer = MedicalTransformer()
        self.redis_store = RedisFeatureStore()

    async def run_full_ingestion(self):
        logger.info("Starting Full Data Ingestion Cycle (Phase 2 Realism)...")
        
        # Ensure tables exist
        from sc_db.session import engine as db_engine
        from sc_db.session import Base
        async with db_engine.begin() as conn:
            # Force recreation for Phase 2 realism schema changes
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        
        await self.publish_event("evt.ingestion.started", {"timestamp": datetime.utcnow().isoformat()})

        try:
            # 0. Initialize Medical Warehouses
            await self._initialize_warehouses()

            # 1. Ingest Suppliers (Pharma Vendors)
            suppliers = self._load_json("Suppliers.json")
            await self._ingest_suppliers(suppliers)
            
            # 2. Ingest Products (Medicines)
            products = self._load_json("Products.json")
            await self._ingest_medicines(products)

            # 3. Ingest Customers (Hospitals & Pharmacies)
            customers = self._load_json("Customers.json")
            await self._ingest_hospitals(customers)

            # 4. Ingest Shippers (Medical Logistics)
            shippers = self._load_json("Shippers.json")
            await self._ingest_logistics(shippers)

            # 5. Ingest Orders & Details (Demand History)
            orders = self._load_json("Orders.json")
            order_details = self._load_json("Order_Details.json")
            await self._ingest_demand(orders, order_details, products)

            logger.info("Full Ingestion Cycle Completed Successfully.")
            await self.publish_event("evt.ingestion.completed", {"status": "success"})
        except Exception as e:
            logger.error(f"Ingestion failed: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            await self.publish_event("evt.ingestion.failed", {"error": str(e)})

    async def _ingest_logistics(self, raw_data: List[Dict[str, Any]]):
        """Task 7: Transform Shippers into medical logistics providers."""
        async with async_session() as session:
            for item in raw_data:
                transformed = self.transformer.transform_shipper(item)
                logger.info(f"Ingested Medical Logistics Provider: {transformed['shipper_name']}")
            await session.commit()
        logger.info(f"Ingested {len(raw_data)} Medical Logistics Providers")

    def _load_json(self, filename: str) -> List[Dict[str, Any]]:
        path = self.data_root / filename
        if not path.exists():
            logger.warning(f"Dataset {filename} not found at {path}")
            return []
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, dict) and "value" in data:
                return data["value"]
            return data

    async def _initialize_warehouses(self):
        """Task 5: Transform generic warehouses into realistic healthcare distribution infrastructure."""
        async with async_session() as session:
            from sc_db.models import Warehouse
            warehouses = [
                Warehouse(id="WH-REG-001", name="Northwest Regional Medical Hub", region="WA", has_cold_chain=True, has_controlled_vault=True, criticality="Primary"),
                Warehouse(id="WH-REG-002", name="Southern Atlantic Distribution Center", region="FL", has_cold_chain=True, has_controlled_vault=False, criticality="Secondary"),
                Warehouse(id="WH-REG-003", name="Central Plains Emergency Reserve", region="IL", has_cold_chain=True, has_controlled_vault=True, criticality="Buffer"),
                Warehouse(id="WH-EURO-001", name="Western Europe Pharma Hub", region="UK", has_cold_chain=True, has_controlled_vault=True, criticality="Primary")
            ]
            for wh in warehouses:
                await session.merge(wh)
            await session.commit()
        logger.info(f"Initialized {len(warehouses)} Medical Warehouses")

    async def _ingest_suppliers(self, raw_data: List[Dict[str, Any]]):
        async with async_session() as session:
            for item in raw_data:
                transformed = self.transformer.transform_supplier(item)
                vendor = PharmaVendor(id=item["SupplierID"], **transformed)
                await session.merge(vendor)
            await session.commit()
        logger.info(f"Ingested {len(raw_data)} Pharma Vendors")

    async def _ingest_medicines(self, raw_data: List[Dict[str, Any]]):
        self.medicine_mapping = {} # OriginalID -> DeduplicatedID
        async with async_session() as session:
            from sc_db.models import Batch, BatchStock
            for item in raw_data:
                transformed = self.transformer.transform_product(item)
                # Ensure Medicine Master Record is unique by name
                med_name = transformed["medicine_name"]
                med_stmt = select(Medicine).where(Medicine.medicine_name == med_name)
                med_res = await session.execute(med_stmt)
                medicine = med_res.scalars().first()
                
                if not medicine:
                    medicine = Medicine(id=item["ProductID"], **transformed)
                    session.add(medicine)
                    await session.flush()
                else:
                    # Update metadata but keep existing ID for this clinical class
                    medicine.is_controlled = transformed["is_controlled"]
                    medicine.is_cold_chain = transformed["is_cold_chain"]
                    medicine.drug_class = transformed["drug_class"]
                
                # Record mapping for other ingestion tasks
                self.medicine_mapping[item["ProductID"]] = medicine.id
                
                # Task 1 & 4: Implement Batch & Expiry Intelligence
                # Create 1-3 batches for each medicine to simulate FEFO
                total_on_hand = medicine.units_in_stock
                if total_on_hand <= 0: total_on_hand = random.randint(50, 500)
                
                # Distribute total stock across batches
                batch_counts = random.randint(1, 3)
                qty_per_batch = total_on_hand // batch_counts
                
                for i in range(batch_counts):
                    batch_num = f"BN-{medicine.id}-{i}-{uuid.uuid4().hex[:4].upper()}"
                    mfg_date = datetime.now() - timedelta(days=random.randint(30, 365))
                    exp_date = mfg_date + timedelta(days=random.randint(180, 730))
                    
                    batch = Batch(
                        batch_number=batch_num,
                        medicine_id=medicine.id,
                        manufacturing_date=mfg_date,
                        expiry_date=exp_date,
                        quarantine_status=(random.random() > 0.95) # 5% quarantine rate
                    )
                    session.add(batch)
                    await session.flush() # Get batch.id

                    # Distribute batch stock across warehouses
                    # For realism, only cold-capable warehouses for cold-chain meds
                    wh_id = "WH-REG-001"
                    if medicine.is_cold_chain:
                        wh_id = random.choice(["WH-REG-001", "WH-REG-002", "WH-REG-003"])
                    
                    batch_stock = BatchStock(
                        batch_id=batch.id,
                        warehouse_id=wh_id,
                        quantity_available=qty_per_batch,
                        quantity_reserved=0
                    )
                    session.add(batch_stock)

                    # Update Aggregate WarehouseStock (Clinical Deduplication)
                    stock_stmt = select(WarehouseStock).where(WarehouseStock.sku == medicine.medicine_name, WarehouseStock.warehouse_id == wh_id)
                    stock_res = await session.execute(stock_stmt)
                    stock = stock_res.scalars().first()
                    
                    if not stock:
                        stock = WarehouseStock(
                            sku=medicine.medicine_name,
                            warehouse_id=wh_id,
                            available_qty=qty_per_batch,
                            reserved_qty=0,
                            quarantine_qty=0,
                            expiring_qty=0,
                            damaged_qty=0,
                            cold_storage_qty=qty_per_batch if medicine.is_cold_chain else 0,
                            emergency_buffer_qty=int(medicine.safety_stock_level * 0.5),
                            quantity_on_hand=qty_per_batch,
                            quantity_reserved=0
                        )
                        session.add(stock)
                    else:
                        stock.available_qty += qty_per_batch
                        stock.quantity_on_hand += qty_per_batch
                        if medicine.is_cold_chain:
                            stock.cold_storage_qty += qty_per_batch

                # Populate Redis features
                await self.redis_store.set_medicine_risk(
                    item["ProductID"], 
                    round(random.uniform(0.05, 0.25), 2),
                    ["Low Stock" if int(item["UnitsInStock"]) < int(item["ReorderLevel"]) else "Stable"]
                )
            await session.commit()
        logger.info(f"Ingested {len(raw_data)} Medicines with Granular Batch Stock")
        logger.info(f"Ingested {len(raw_data)} Medicines with Batch Intelligence")
        await self.publish_event("evt.inventory.updated", {"count": len(raw_data)})

    async def _ingest_hospitals(self, raw_data: List[Dict[str, Any]]):
        async with async_session() as session:
            for i, item in enumerate(raw_data):
                transformed = self.transformer.transform_customer(item)
                hospital = Hospital(
                    id=i+1, 
                    hospital_name=transformed["hospital_name"], 
                    city=transformed["city"], 
                    region=transformed["region"],
                    hospital_type=transformed["hospital_type"],
                    patient_volume=transformed["patient_volume"],
                    criticality=transformed["criticality"]
                )
                await session.merge(hospital)
            await session.commit()
        logger.info(f"Ingested {len(raw_data)} Hospitals & Pharmacies")

    async def _ingest_demand(self, orders: List[Dict[str, Any]], details: List[Dict[str, Any]], medicines: List[Dict[str, Any]]):
        logger.info(f"Ingesting Demand: {len(orders)} orders, {len(details)} details")
        # Simplified mapping for demonstration
        async with async_session() as session:
            # Group details by order id
            details_map = {}
            for d in details:
                oid = d.get("OrderID")
                if oid not in details_map:
                    details_map[oid] = []
                details_map[oid].append(d)
            
            logger.info(f"Grouped {len(details_map)} orders with details")

            ingested_count = 0
            for order in orders[:500]: # Increased limit
                oid = order["OrderID"]
                order_details = details_map.get(oid, [])
                
                # Safer date parsing
                order_date_str = order["OrderDate"].replace('Z', '+00:00')
                order_date = datetime.fromisoformat(order_date_str)

                for detail in order_details:
                    # Resolve to deduplicated clinical medicine ID
                    med_id = self.medicine_mapping.get(detail["ProductID"])
                    if not med_id: continue # Should not happen if products were ingested

                    # In Postgres
                    demand = DemandHistory(
                        medicine_id=med_id,
                        date=order_date,
                        quantity_demanded=detail["Quantity"],
                        region=order.get("ShipRegion", "Global") or "Global"
                    )
                    session.add(demand)
                    ingested_count += 1

                    # In Redis
                    medicine_info = next((m for m in medicines if m["ProductID"] == detail["ProductID"]), None)
                    if medicine_info:
                        transformed_med = self.transformer.transform_product(medicine_info)
                        med_sku = transformed_med["medicine_name"]
                        await self.redis_store.record_demand(
                            sku=med_sku,
                            warehouse_id="WH-REG-001",
                            quantity=detail["Quantity"],
                            timestamp=order_date
                        )
            await session.commit()
            logger.info(f"Ingested {ingested_count} Demand History records")
        logger.info("Ingested Demand History from Orders/Details")
        await self.publish_event("evt.forecast.dataset.loaded", {"type": "historical_demand"})

    async def publish_event(self, event_type: str, payload: dict):
        from sc_events.envelope import EventEnvelope, EventMetadata
        envelope = EventEnvelope(
            metadata=EventMetadata(
                event_type=event_type,
                service="data-ingestion-service"
            ),
            payload=payload
        )
        await self.producer.publish("medical-events", envelope)
