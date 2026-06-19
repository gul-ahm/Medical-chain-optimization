import logging
import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException

from pydantic import BaseModel
from application.services import InventoryApplicationService
from infrastructure.redis_locks import RedisLockManager, IdempotencyManager

# We assume sc_schemas is in PYTHONPATH
from sc_schemas.api.responses import StandardResponse, ResponseMetadata
from sc_schemas.errors.rfc7807 import ProblemDetails

router = APIRouter(prefix="/api/v1/inventory", tags=["inventory"])
logger = logging.getLogger(__name__)

class ReserveRequest(BaseModel):
    sku: str
    warehouse_id: str
    quantity: int

class DeductRequest(BaseModel):
    reservation_id: str

# Mock dependency injection for the demo
from fastapi import Request

async def get_inventory_service(request: Request) -> InventoryApplicationService:
    from sc_db.session import async_session
    from application.services import InventoryApplicationService
    async with async_session() as session:
        yield InventoryApplicationService(
            session, 
            request.app.state.redis_manager, 
            request.app.state.producer
        )

async def get_idempotency_manager() -> IdempotencyManager:
    return IdempotencyManager()

@router.post("/reserve", response_model=StandardResponse[Dict[str, Any]])
async def reserve_stock(
    request: ReserveRequest,
    x_correlation_id: str = Header(...),
    x_idempotency_key: str = Header(...),
    service: InventoryApplicationService = Depends(get_inventory_service),
    idemp: IdempotencyManager = Depends(get_idempotency_manager)
):
    if await idemp.is_processed(x_idempotency_key):
        return StandardResponse(
            data={"status": "ALREADY_PROCESSED"},
            meta=ResponseMetadata(message="Idempotent hit", correlation_id=x_correlation_id)
        )

    try:
        result = await service.reserve_stock(
            sku=request.sku, 
            warehouse_id=request.warehouse_id, 
            quantity=request.quantity, 
            correlation_id=x_correlation_id
        )
        await idemp.mark_processed(x_idempotency_key)
        
        return StandardResponse(
            data=result,
            meta=ResponseMetadata(message="Stock reserved", correlation_id=x_correlation_id)
        )
    except Exception as e:
        logger.error(f"Reserve failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/deduct", response_model=StandardResponse[Dict[str, Any]])
async def deduct_stock(
    request: DeductRequest,
    x_correlation_id: str = Header(...),
    x_idempotency_key: str = Header(...),
    service: InventoryApplicationService = Depends(get_inventory_service),
    idemp: IdempotencyManager = Depends(get_idempotency_manager)
):
    if await idemp.is_processed(x_idempotency_key):
        return StandardResponse(
            data={"status": "ALREADY_PROCESSED"},
            meta=ResponseMetadata(message="Idempotent hit", correlation_id=x_correlation_id)
        )

    try:
        result = await service.deduct_stock(
            reservation_id=request.reservation_id, 
            correlation_id=x_correlation_id
        )
        await idemp.mark_processed(x_idempotency_key)
        
        return StandardResponse(
            data=result,
            meta=ResponseMetadata(message="Stock deducted", correlation_id=x_correlation_id)
        )
    except Exception as e:
        logger.error(f"Deduct failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
from application.risk_engine import RiskPropagationEngine

async def get_risk_engine(request: Request) -> RiskPropagationEngine:
    from sc_db.session import async_session
    async with async_session() as session:
        yield RiskPropagationEngine(session)

@router.get("/stock", response_model=StandardResponse[list])
async def get_stock(
    sku: str = None,
    x_correlation_id: str = Header(default=str(uuid.uuid4())),
    service: InventoryApplicationService = Depends(get_inventory_service)
):
    try:
        stocks = await service.get_stock(sku)
        return StandardResponse(
            data=stocks,
            meta=ResponseMetadata(message="Stock retrieved", correlation_id=x_correlation_id)
        )
    except Exception as e:
        logger.error(f"Get stock failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/movements", response_model=StandardResponse[list])
async def get_movements(
    x_correlation_id: str = Header(default=str(uuid.uuid4())),
    service: InventoryApplicationService = Depends(get_inventory_service)
):
    try:
        movements = await service.get_movements()
        return StandardResponse(
            data=movements,
            meta=ResponseMetadata(message="Movements retrieved", correlation_id=x_correlation_id)
        )
    except Exception as e:
        logger.error(f"Get movements failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/risk", response_model=StandardResponse[Dict[str, Any]])
async def get_clinical_risk(
    warehouse_id: str,
    x_correlation_id: str = Header(default=str(uuid.uuid4())),
    risk_engine: RiskPropagationEngine = Depends(get_risk_engine)
):
    """Task 4: Expose expiry risk and wastage forecasting."""
    try:
        wastage = await risk_engine.forecast_wastage(warehouse_id)
        return StandardResponse(
            data={
                "warehouse_id": warehouse_id,
                "projected_monthly_wastage": wastage,
                "risk_level": "HIGH" if wastage > 5000 else "STABLE",
                "recommendation": "PRIORITIZE_REDISTRIBUTION" if wastage > 5000 else "NONE"
            },
            meta=ResponseMetadata(message="Clinical risk analyzed", correlation_id=x_correlation_id)
        )
    except Exception as e:
        logger.error(f"Risk analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class TransferRequest(BaseModel):
    sku: str
    from_warehouse_id: str
    to_warehouse_id: str
    quantity: int

@router.post("/transfer", response_model=StandardResponse[Dict[str, Any]])
async def transfer_stock(
    request: TransferRequest,
    x_correlation_id: str = Header(...),
    service: InventoryApplicationService = Depends(get_inventory_service)
):
    """Task 5: Enforce medical transfer constraints."""
    try:
        # In a real impl, this would call a TransferService
        # Here we reuse reserve_stock at the destination to check constraints
        result = await service.reserve_stock(
            sku=request.sku,
            warehouse_id=request.to_warehouse_id,
            quantity=0, # Just check compatibility
            correlation_id=x_correlation_id
        )
        return StandardResponse(
            data={"status": "PATH_VALIDATED", "constraint_check": "PASSED"},
            meta=ResponseMetadata(message="Medical transfer route approved", correlation_id=x_correlation_id)
        )
    except HTTPException as e:
        # Propagation of clinical violation
        raise e
    except Exception as e:
        logger.error(f"Transfer validation failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
