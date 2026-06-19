import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, BigInteger, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class WarehouseStock(Base):
    __tablename__ = "warehouse_stock"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = Column(String, nullable=False, index=True)
    warehouse_id = Column(String, nullable=False, index=True)
    quantity_on_hand = Column(Integer, nullable=False, default=0)
    quantity_reserved = Column(Integer, nullable=False, default=0)
    
    # Optimistic Concurrency Control
    version_id = Column(Integer, nullable=False, default=1)
    
    __mapper_args__ = {
        "version_id_col": version_id
    }

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = Column(String, nullable=False)
    warehouse_id = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="PENDING") # PENDING, FULFILLED, CANCELLED
    correlation_id = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

class InventoryLedger(Base):
    __tablename__ = "inventory_ledger"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = Column(String, nullable=False)
    warehouse_id = Column(String, nullable=False)
    change_quantity = Column(Integer, nullable=False)
    reason = Column(String, nullable=False) # e.g., "CUSTOMER_ORDER", "MANUAL_ADJUSTMENT"
    correlation_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
