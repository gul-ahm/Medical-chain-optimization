import logging
from typing import List, Dict, Any
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

logger = logging.getLogger(__name__)
security = HTTPBearer()

from sc_auth.jwt import JWTManager, RBAC

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    token = credentials.credentials
    try:
        return JWTManager.decode_token(token)
    except Exception as e:
        logger.error(f"JWT Validation failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

class RequiresRole:
    def __init__(self, required_role: str):
        self.required_role = required_role

    def __call__(self, user: Dict[str, Any] = Security(get_current_user)):
        user_role = user.get("role", "viewer")
        if not RBAC.has_permission(user_role, self.required_role):
            raise HTTPException(status_code=403, detail=f"User lacks required role: {self.required_role}")
        return user
