import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from sc_db.models import WarehouseStock, Reservation, InventoryLedger
from infrastructure.redis_locks import RedisLockManager, IdempotencyManager

# We assume sc_events and sc_schemas are in PYTHONPATH
from sc_events.producer import AsyncKafkaProducer
from sc_events.envelope import EventEnvelope, EventMetadata
from sc_events.registry import TopicRegistry

logger = logging.getLogger(__name__)

from tenacity import retry, wait_exponential, stop_after_attempt

from sc_db.models import WarehouseStock, Reservation, InventoryLedger, Batch, BatchStock, Medicine, Warehouse

class InventoryApplicationService:
    def __init__(self, session: AsyncSession, redis_manager: RedisLockManager, producer: AsyncKafkaProducer):
        self.session = session
        self.redis_manager = redis_manager
        self.producer = producer

    @retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(3))
    async def reserve_stock(self, sku: str, warehouse_id: str, quantity: int, correlation_id: str) -> dict:
        lock_key = f"reserve:{sku}:{warehouse_id}"
        
        try:
            async with self.redis_manager.acquire_lock(lock_key):
                # 1. Fetch Medicine and Warehouse Metadata for clinical enforcement
                med_stmt = select(Medicine).where(Medicine.medicine_name == sku)
                wh_stmt = select(Warehouse).where(Warehouse.id == warehouse_id)
                
                med_res = await self.session.execute(med_stmt)
                wh_res = await self.session.execute(wh_stmt)
                
                medicine = med_res.scalars().first()
                warehouse = wh_res.scalars().first()

                if not medicine or not warehouse:
                    logger.error(f"Entity missing: Med {sku} ({medicine}), WH {warehouse_id} ({warehouse})")
                    raise HTTPException(status_code=404, detail="Clinical entity not found")

                logger.info(f"Clinical Check: Med {sku} (Cold: {medicine.is_cold_chain}, Controlled: {medicine.is_controlled}) in WH {warehouse_id} (Cold: {warehouse.has_cold_chain}, Vault: {warehouse.has_controlled_vault})")

                # Task 2: Cold-Chain Runtime Enforcement
                if medicine.is_cold_chain and not warehouse.has_cold_chain:
                    logger.error(f"COLD-CHAIN VIOLATION: Med {sku} requires cold storage. WH {warehouse_id} is not capable.")
                    raise HTTPException(status_code=400, detail="Storage mismatch: Cold-chain capability missing at destination")

                # Task 3: Controlled Substance Enforcement
                if medicine.is_controlled and not warehouse.has_controlled_vault:
                    logger.error(f"VAULT VIOLATION: Med {sku} is controlled. WH {warehouse_id} lacks vault.")
                    raise HTTPException(status_code=400, detail="Storage mismatch: Vault required for controlled substances")

                # Task 1: TRUE FEFO EXECUTION ENGINE
                # Find available batches for this medicine in this warehouse, sorted by expiry
                batch_stmt = (
                    select(Batch, BatchStock)
                    .join(BatchStock, Batch.id == BatchStock.batch_id)
                    .where(
                        Batch.medicine_id == medicine.id,
                        BatchStock.warehouse_id == warehouse_id,
                        BatchStock.quantity_available > 0,
                        Batch.quarantine_status == False,
                        Batch.recall_status == False
                    )
                    .order_by(Batch.expiry_date.asc())
                )
                
                batch_results = await self.session.execute(batch_stmt)
                available_batches = batch_results.all()

                print(f"FEFO DEBUG: Found {len(available_batches)} batches for {sku} in {warehouse_id}")
                for b, bs in available_batches:
                    print(f"  - Batch {b.batch_number} Expiry {b.expiry_date} Qty {bs.quantity_available}")

                total_available = sum(bs.quantity_available for b, bs in available_batches)
                
                if total_available < quantity:
                    print(f"FEFO FAILURE: Insufficient stock. Req {quantity}, Avail {total_available}")
                    raise HTTPException(status_code=400, detail="Insufficient available clinical stock (FEFO)")

                # Allocate from batches using FEFO
                remaining_to_allocate = quantity
                allocated_batches = []
                
                for batch, batch_stock in available_batches:
                    if remaining_to_allocate <= 0: break
                    
                    take = min(batch_stock.quantity_available, remaining_to_allocate)
                    if take <= 0: continue
                    
                    batch_stock.quantity_available -= take
                    batch_stock.quantity_reserved += take
                    
                    allocated_batches.append({
                        "batch_id": batch.id,
                        "batch_number": batch.batch_number,
                        "expiry": batch.expiry_date.isoformat(),
                        "quantity": take
                    })
                    
                    remaining_to_allocate -= take

                if not allocated_batches:
                    print("FEFO FAILURE: No batches actually allocated despite total_available check")
                    raise HTTPException(status_code=400, detail="Insufficient available clinical stock (FEFO Allocation Failed)")

                # Update Aggregate Stock (for dashboard performance)
                stock_stmt = select(WarehouseStock).where(WarehouseStock.sku == sku, WarehouseStock.warehouse_id == warehouse_id)
                stock_res = await self.session.execute(stock_stmt)
                stock = stock_res.scalars().first()
                if stock:
                    stock.available_qty -= quantity
                    stock.reserved_qty += quantity

                # Create Reservation (linked to the primary batch for audit)
                primary_batch = allocated_batches[0]
                reservation = Reservation(
                    id=str(uuid.uuid4()),
                    sku=sku,
                    warehouse_id=warehouse_id,
                    batch_id=primary_batch["batch_id"],
                    quantity=quantity,
                    correlation_id=correlation_id,
                    expires_at=datetime.utcnow() + timedelta(minutes=15)
                )
                self.session.add(reservation)
                
                await self.session.commit()

                # Emit Kafka Event with FEFO metadata
                envelope = EventEnvelope(
                    metadata=EventMetadata(
                        event_type="InventoryReservedFEFO",
                        correlation_id=correlation_id
                    ),
                    payload={
                        "reservation_id": reservation.id,
                        "sku": sku,
                        "warehouse_id": warehouse_id,
                        "quantity": quantity,
                        "allocated_batches": allocated_batches,
                        "is_cold_chain": medicine.is_cold_chain,
                        "is_controlled": medicine.is_controlled
                    }
                )
                await self.producer.publish(TopicRegistry.INVENTORY_RESERVED, envelope)

                return {
                    "reservation_id": reservation.id, 
                    "status": "RESERVED",
                    "fefo_allocation": allocated_batches
                }
        except Exception as e:
            logger.exception(f"Error during FEFO stock reservation: {e}")
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=str(e))

    @retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(3))
    async def deduct_stock(self, reservation_id: str, correlation_id: str) -> dict:
        stmt = select(Reservation).where(Reservation.id == reservation_id)
        result = await self.session.execute(stmt)
        reservation = result.scalars().first()

        if not reservation or reservation.status != "PENDING":
            raise HTTPException(status_code=404, detail="Invalid reservation")

        lock_key = f"reserve:{reservation.sku}:{reservation.warehouse_id}"
        try:
            async with self.redis_manager.acquire_lock(lock_key):
                # Update Aggregate
                stock_stmt = select(WarehouseStock).where(WarehouseStock.sku == reservation.sku, WarehouseStock.warehouse_id == reservation.warehouse_id)
                stock_res = await self.session.execute(stock_stmt)
                stock = stock_res.scalars().first()
                if stock:
                    stock.reserved_qty -= reservation.quantity
                
                # Update Batch Stock (using primary batch from reservation for simplicity in this MVP)
                # In a full impl, we'd track ALL allocated batches in a Detail table
                bs_stmt = select(BatchStock).where(BatchStock.batch_id == reservation.batch_id, BatchStock.warehouse_id == reservation.warehouse_id)
                bs_res = await self.session.execute(bs_stmt)
                batch_stock = bs_res.scalars().first()
                if batch_stock:
                    batch_stock.quantity_reserved -= reservation.quantity

                reservation.status = "FULFILLED"

                ledger = InventoryLedger(
                    id=str(uuid.uuid4()),
                    sku=reservation.sku,
                    warehouse_id=reservation.warehouse_id,
                    batch_id=reservation.batch_id,
                    change_quantity=-reservation.quantity,
                    reason="CLINICAL_ORDER_FULFILLMENT",
                    correlation_id=correlation_id
                )
                self.session.add(ledger)
                await self.session.commit()

                return {"status": "DEDUCTED", "batch_id": reservation.batch_id}
        except Exception as e:
            await self.session.rollback()
            raise

    async def get_stock(self, sku: str = None) -> list:
        try:
            # Include batch-level details for frontend drilldowns
            stmt = select(WarehouseStock)
            if sku:
                stmt = stmt.where(WarehouseStock.sku == sku)
            result = await self.session.execute(stmt)
            stocks = result.scalars().all()
            
            output = []
            for s in stocks:
                batches_data = []
                # Task 7: Fetch batches for drilldown ONLY if specific SKU or small list
                if sku or len(stocks) < 5:
                    batch_stmt = (
                        select(Batch, BatchStock)
                        .join(BatchStock, Batch.id == BatchStock.batch_id)
                        .where(BatchStock.warehouse_id == s.warehouse_id, Batch.medicine_id == (select(Medicine.id).where(Medicine.medicine_name == s.sku).limit(1).scalar_subquery()))
                        .order_by(Batch.expiry_date.asc())
                    )
                    b_res = await self.session.execute(batch_stmt)
                    batches = b_res.all()
                    batches_data = [
                        {
                            "batch_number": b.batch_number,
                            "expiry": b.expiry_date.isoformat(),
                            "qty": bs.quantity_available,
                            "quarantine": b.quarantine_status
                        } for b, bs in batches
                    ]
                
                output.append({
                    "sku": s.sku,
                    "warehouse_id": s.warehouse_id,
                    "available": s.available_qty,
                    "reserved": s.reserved_qty,
                    "quarantine": s.quarantine_qty,
                    "expiring": s.expiring_qty,
                    "cold_storage": s.cold_storage_qty,
                    "emergency_buffer": s.emergency_buffer_qty,
                    "damaged": s.damaged_qty,
                    "batches": batches_data
                })
            return output
        except Exception as db_err:
            logger.error(f"Database query failed: {db_err}")
            raise HTTPException(status_code=500, detail="Database connection failed")

    async def get_movements(self) -> list:
        try:
            stmt = select(InventoryLedger).order_by(InventoryLedger.created_at.desc()).limit(50)
            result = await self.session.execute(stmt)
            ledgers = result.scalars().all()
            
            output = []
            for ledger in ledgers:
                # Get unit price if medicine exists
                med_stmt = select(Medicine).where(Medicine.medicine_name == ledger.sku)
                med_res = await self.session.execute(med_stmt)
                med = med_res.scalars().first()
                unit_price = med.unit_price if med else 25.0
                
                # Determine type
                m_type = "transfer" if "TRANSFER" in ledger.reason else ("inbound" if ledger.change_quantity > 0 else "outbound")
                
                # Determine relative time
                now = datetime.utcnow()
                diff = now - ledger.created_at
                if diff.days > 0:
                    time_str = f"{diff.days}d ago"
                elif diff.seconds >= 3600:
                    time_str = f"{diff.seconds // 3600}h ago"
                elif diff.seconds >= 60:
                    time_str = f"{diff.seconds // 60}m ago"
                else:
                    time_str = "Just now"
                    
                output.append({
                    "id": ledger.id,
                    "type": m_type,
                    "sku": ledger.sku,
                    "qty": abs(ledger.change_quantity),
                    "warehouse": ledger.warehouse_id,
                    "time": time_str,
                    "value": abs(ledger.change_quantity) * unit_price
                })
            
            return output
        except Exception as e:
            logger.error(f"Error in get_movements: {e}")
            raise HTTPException(status_code=500, detail="Database query error in get_movements")

