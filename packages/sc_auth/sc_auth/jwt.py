import jwt
from datetime import datetime, timedelta
from typing import Optional

SECRET_KEY = "enterprise-secret-do-not-use-in-prod"
ALGORITHM = "HS256"

ROLE_HIERARCHY = {
    "viewer": 1,
    "analyst": 2,
    "planner": 3,
    "warehouse_manager": 4,
    "operations_admin": 5,
    "super_admin": 10
}

class JWTManager:
    @staticmethod
    def create_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=30))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> dict:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

class RBAC:
    @staticmethod
    def has_permission(user_role: str, required_role: str) -> bool:
        return ROLE_HIERARCHY.get(user_role, 0) >= ROLE_HIERARCHY.get(required_role, 99)
