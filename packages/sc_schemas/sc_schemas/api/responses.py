from pydantic import BaseModel
from typing import Generic, TypeVar, Optional, List

T = TypeVar("T")

class ResponseMetadata(BaseModel):
    message: str = "Success"
    correlation_id: Optional[str] = None
    count: Optional[int] = None

class StandardResponse(BaseModel, Generic[T]):
    data: T
    meta: ResponseMetadata
    errors: Optional[List[str]] = None
