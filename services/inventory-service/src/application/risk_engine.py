import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sc_db.models import Batch, BatchStock, Medicine, WarehouseStock, MedicineShipment

logger = logging.getLogger(__name__)

class RiskPropagationEngine:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def calculate_expiry_risk(self, batch_id: int) -> Dict[str, Any]:
        """Task 4: Dynamic expiry risk scoring."""
        stmt = select(Batch, Medicine).join(Medicine, Batch.medicine_id == Medicine.id).where(Batch.id == batch_id)
        result = await self.session.execute(stmt)
        res = result.first()
        if not res: return {"risk_score": 0, "label": "Unknown"}
        
        batch, medicine = res
        
        total_shelf_life = (batch.expiry_date - batch.manufacturing_date).days
        remaining_life = (batch.expiry_date - datetime.now()).days
        
        if total_shelf_life <= 0: risk_score = 1.0
        else: risk_score = 1.0 - (remaining_life / total_shelf_life)
        
        risk_score = max(0.0, min(1.0, risk_score))
        
        label = "Stable"
        if risk_score > 0.8: label = "CRITICAL_EXPIRY"
        elif risk_score > 0.6: label = "HIGH_RISK"
        elif risk_score > 0.4: label = "MODERATE_RISK"
        
        return {
            "batch_number": batch.batch_number,
            "risk_score": round(risk_score, 4),
            "label": label,
            "days_remaining": remaining_life,
            "financial_wastage_est": round(medicine.unit_price * 100, 2) # Example multiplier
        }

    async def simulate_cold_chain_breach(self, shipment_id: int):
        """Task 9: Operational risk propagation. 
        A delay in a cold-chain shipment causes batch quarantine.
        """
        stmt = select(MedicineShipment).where(MedicineShipment.id == shipment_id)
        res = await self.session.execute(stmt)
        shipment = res.scalars().first()
        
        if not shipment: return
        
        # In a real impl, we'd find the batches in this shipment
        # For now, we simulate the propagation effect
        logger.warning(f"RISK PROPAGATION: Cold-chain breach detected for Shipment {shipment_id}")
        shipment.temperature_excursion = True
        await self.session.commit()
        
        return {"status": "RISK_PROPAGATED", "impact": "Temperature Excursion Logged"}

    async def forecast_wastage(self, warehouse_id: str) -> float:
        """Task 4: Wastage forecasting based on expiring inventory."""
        stmt = (
            select(Batch, BatchStock, Medicine)
            .join(BatchStock, Batch.id == BatchStock.batch_id)
            .join(Medicine, Batch.medicine_id == Medicine.id)
            .where(
                BatchStock.warehouse_id == warehouse_id,
                Batch.expiry_date < (datetime.now() + timedelta(days=30))
            )
        )
        res = await self.session.execute(stmt)
        expiring_items = res.all()
        
        total_wastage = sum(bs.quantity_available * m.unit_price for b, bs, m in expiring_items)
        return round(total_wastage, 2)
