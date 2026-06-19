import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sc_auth.jwt import JWTManager

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
logger = logging.getLogger(__name__)

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    # Stub: Real app would hash password and check DB
    if request.password != "password":
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Mocking a dynamic role based on email for the architectural demo
    role = "viewer"
    if "admin" in request.email:
        role = "operations_admin"
    elif "manager" in request.email:
        role = "warehouse_manager"
        
    access_token = JWTManager.create_token(data={"sub": request.email, "role": role})
    
    logger.info(f"User {request.email} logged in with role {role}")
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=role
    )
