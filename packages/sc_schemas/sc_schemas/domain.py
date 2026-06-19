from pydantic import BaseModel
from typing import Optional, List

class InventoryPayload(BaseModel):
    sku: str
    warehouse_id: str
    quantity: int

class InventoryReservedPayload(InventoryPayload):
    reservation_id: str

class InventoryDeductedPayload(BaseModel):
    sku: str
    warehouse_id: str
    deducted_quantity: int

class ForecastPayload(BaseModel):
    product_id: str
    horizon_days: int
    forecast: List[dict]

class OptimizationPayload(BaseModel):
    source_node: str
    dest_node: str
    sku: str
    quantity: int
    confidence: float

class ApprovalPayload(BaseModel):
    approval_id: str
    action: str # e.g., "TRANSFER"
    payload: dict
    status: str
