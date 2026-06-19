import uuid
from datetime import datetime
from typing import TypeVar, Generic, Optional
from pydantic import BaseModel, Field

T = TypeVar("T")

class EventMetadata(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    correlation_id: Optional[str] = None
    causation_id: Optional[str] = None
    version: str = "v1"

class EventEnvelope(BaseModel, Generic[T]):
    metadata: EventMetadata
    payload: T
