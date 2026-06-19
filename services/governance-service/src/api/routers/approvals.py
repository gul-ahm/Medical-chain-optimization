import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, Header, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from sc_auth.jwt import JWTManager, RBAC
from sc_schemas.api.responses import StandardResponse, ResponseMetadata
from sc_events.producer import AsyncKafkaProducer
from application.approval_engine import ApprovalEngine

router = APIRouter(prefix="/api/v1/approvals", tags=["approvals"])
security = HTTPBearer()
logger = logging.getLogger(__name__)

class DecisionRequest(BaseModel):
    decision: str # APPROVED or REJECTED

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    return JWTManager.decode_token(credentials.credentials)

def RequiresRole(required_role: str):
    def role_checker(user: dict = Depends(get_current_user)):
        if not RBAC.has_permission(user.get("role", "viewer"), required_role):
            logger.warning(f"RBAC VIOLATION: {user.get('sub')} attempted to access {required_role} resource.")
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

async def get_approval_engine() -> ApprovalEngine:
    return ApprovalEngine(AsyncKafkaProducer())

@router.post("/{request_id}/decide", response_model=StandardResponse[Dict[str, str]])
async def make_decision(
    request_id: str,
    request: DecisionRequest,
    user: dict = Depends(RequiresRole("operations_admin")), # STRICT RBAC GUARD
    x_correlation_id: str = Header(default="api-req"),
    engine: ApprovalEngine = Depends(get_approval_engine)
):
    try:
        await engine.process_manual_decision(request_id, actor_id=user["sub"], decision=request.decision)
        return StandardResponse(
            data={"status": "DECISION_RECORDED"},
            meta=ResponseMetadata(message=f"Request {request.decision}", correlation_id=x_correlation_id)
        )
    except Exception as e:
        logger.error(f"Decision failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to process decision")
