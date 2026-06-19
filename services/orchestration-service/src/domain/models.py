import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, Boolean
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class SagaState(Base):
    """Aggregate root tracking a distributed transaction's global state."""
    __tablename__ = "saga_states"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    correlation_id = Column(String, unique=True, index=True, nullable=False)
    saga_type = Column(String, nullable=False) # e.g., "WarehouseTransfer"
    status = Column(String, nullable=False, default="PENDING") # PENDING, RUNNING, COMPLETED, FAILED, COMPENSATING, COMPENSATED
    current_step = Column(String, nullable=False)
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class SagaStep(Base):
    __tablename__ = "saga_steps"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    correlation_id = Column(String, index=True, nullable=False)
    step_name = Column(String, nullable=False)
    status = Column(String, nullable=False) # SUCCESS, FAILURE
    error_message = Column(String, nullable=True)
    executed_at = Column(DateTime(timezone=True), default=datetime.utcnow)
