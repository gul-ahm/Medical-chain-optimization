from sqlalchemy import String, Integer, Float, ForeignKey, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship, DeclarativeBase
from datetime import datetime
from typing import List, Optional

from sc_db.mixins import TimestampMixin, AuditMixin
from sc_db.session import Base

class Medicine(Base, TimestampMixin, AuditMixin):
    __tablename__ = "medicines"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    medicine_name: Mapped[str] = mapped_column(String(255), nullable=False) # Generic Name
    brand_name: Mapped[Optional[str]] = mapped_column(String(255))
    drug_class: Mapped[str] = mapped_column(String(100))
    formulation: Mapped[str] = mapped_column(String(100)) # e.g. Tablet, Injection
    dosage_strength: Mapped[str] = mapped_column(String(50)) # e.g. 500mg
    administration_route: Mapped[str] = mapped_column(String(100)) # e.g. Oral, IV
    
    unit_price: Mapped[float] = mapped_column(Float)
    
    # Storage & Logistics
    storage_requirement: Mapped[str] = mapped_column(String(255)) # e.g. Room Temp, Cold Chain
    is_cold_chain: Mapped[bool] = mapped_column(default=False)
    is_controlled: Mapped[bool] = mapped_column(default=False)
    controlled_level: Mapped[Optional[str]] = mapped_column(String(50)) # e.g. Schedule II
    criticality_level: Mapped[str] = mapped_column(String(50), default="Routine") # Emergency, Critical, Routine
    
    # Legacy fields for backward compatibility during phase transition
    units_in_stock: Mapped[int] = mapped_column(Integer, default=0)
    safety_stock_level: Mapped[int] = mapped_column(Integer, default=10)
    expiry_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    batch_id: Mapped[str] = mapped_column(String(50))
    clinical_category: Mapped[str] = mapped_column(String(100))
    
    supplier_id: Mapped[Optional[int]] = mapped_column(ForeignKey("pharma_vendors.id"))
    supplier = relationship("PharmaVendor", back_populates="medicines")

class PharmaVendor(Base, TimestampMixin, AuditMixin):
    __tablename__ = "pharma_vendors"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    vendor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_lead: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100))
    reliability_score: Mapped[float] = mapped_column(Float, default=1.0)
    vendor_type: Mapped[str] = mapped_column(String(50), default="Manufacturer") # Manufacturer, Distributor, Wholesaler
    certification_level: Mapped[str] = mapped_column(String(50), default="GDP Compliant") # GMP, GDP, ISO
    cold_chain_capable: Mapped[bool] = mapped_column(default=False)
    
    medicines = relationship("Medicine", back_populates="supplier")

class Hospital(Base, TimestampMixin, AuditMixin):
    __tablename__ = "hospitals"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    hospital_name: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100))
    region: Mapped[str] = mapped_column(String(100))
    hospital_type: Mapped[str] = mapped_column(String(100)) # General Hospital, Specialist Clinic, etc.
    patient_volume: Mapped[str] = mapped_column(String(50), default="Medium") # High, Medium, Low
    criticality: Mapped[str] = mapped_column(String(50), default="Standard") # Trauma Level 1, Regional Hub, Standard
    
    orders = relationship("MedicineOrder", back_populates="hospital")

class Warehouse(Base, TimestampMixin):
    __tablename__ = "warehouses"
    
    id: Mapped[str] = mapped_column(String(50), primary_key=True) # e.g. WH-REG-001
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    region: Mapped[str] = mapped_column(String(100))
    has_cold_chain: Mapped[bool] = mapped_column(default=True)
    has_controlled_vault: Mapped[bool] = mapped_column(default=False)
    criticality: Mapped[str] = mapped_column(String(50), default="Standard") # Primary, Secondary, Buffer
    
    stocks = relationship("WarehouseStock", back_populates="warehouse")
    batch_stocks = relationship("BatchStock", back_populates="warehouse")

class Batch(Base, TimestampMixin):
    __tablename__ = "batches"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    batch_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    medicine_id: Mapped[int] = mapped_column(ForeignKey("medicines.id"))
    manufacturing_date: Mapped[datetime] = mapped_column(DateTime)
    expiry_date: Mapped[datetime] = mapped_column(DateTime)
    quarantine_status: Mapped[bool] = mapped_column(default=False)
    recall_status: Mapped[bool] = mapped_column(default=False)
    
    medicine = relationship("Medicine")
    stocks = relationship("BatchStock", back_populates="batch")

class BatchStock(Base, TimestampMixin):
    __tablename__ = "batch_stock"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"))
    warehouse_id: Mapped[str] = mapped_column(ForeignKey("warehouses.id"))
    
    quantity_available: Mapped[int] = mapped_column(Integer, default=0)
    quantity_reserved: Mapped[int] = mapped_column(Integer, default=0)
    
    batch = relationship("Batch", back_populates="stocks")
    warehouse = relationship("Warehouse", back_populates="batch_stocks")

class MedicineOrder(Base, TimestampMixin):
    __tablename__ = "medicine_orders"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    order_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(50)) # PENDING, SHIPPED, DELIVERED
    
    hospital_id: Mapped[int] = mapped_column(ForeignKey("hospitals.id"))
    hospital = relationship("Hospital", back_populates="orders")
    
    details = relationship("MedicineOrderDetail", back_populates="order")

class MedicineOrderDetail(Base):
    __tablename__ = "medicine_order_details"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("medicine_orders.id"))
    medicine_id: Mapped[int] = mapped_column(ForeignKey("medicines.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[float] = mapped_column(Float)
    
    order = relationship("MedicineOrder", back_populates="details")

class DemandHistory(Base):
    __tablename__ = "demand_history"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    medicine_id: Mapped[int] = mapped_column(ForeignKey("medicines.id"))
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    quantity_demanded: Mapped[int] = mapped_column(Integer)
    region: Mapped[str] = mapped_column(String(100))

class MedicineShipment(Base, TimestampMixin):
    __tablename__ = "medicine_shipments"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("medicine_orders.id"))
    shipper_name: Mapped[str] = mapped_column(String(100))
    tracking_number: Mapped[str] = mapped_column(String(100))
    shipped_date: Mapped[datetime] = mapped_column(DateTime)
    
    # Operational Realism
    logistics_provider_id: Mapped[Optional[int]] = mapped_column(ForeignKey("pharma_vendors.id"))
    temperature_excursion: Mapped[bool] = mapped_column(default=False)
    estimated_arrival: Mapped[datetime] = mapped_column(DateTime)

class WarehouseStock(Base, TimestampMixin):
    __tablename__ = "warehouse_stock"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    sku: Mapped[str] = mapped_column(String(255), nullable=False)
    warehouse_id: Mapped[str] = mapped_column(ForeignKey("warehouses.id"))
    
    # Granular Healthcare Inventory (Aggregate for performance)
    available_qty: Mapped[int] = mapped_column(Integer, default=0)
    reserved_qty: Mapped[int] = mapped_column(Integer, default=0)
    quarantine_qty: Mapped[int] = mapped_column(Integer, default=0)
    expiring_qty: Mapped[int] = mapped_column(Integer, default=0)
    damaged_qty: Mapped[int] = mapped_column(Integer, default=0)
    cold_storage_qty: Mapped[int] = mapped_column(Integer, default=0)
    emergency_buffer_qty: Mapped[int] = mapped_column(Integer, default=0)
    
    # Redundant but useful for Phase 1 compatibility
    quantity_on_hand: Mapped[int] = mapped_column(Integer, default=0)
    quantity_reserved: Mapped[int] = mapped_column(Integer, default=0)
    
    version_id: Mapped[int] = mapped_column(Integer, default=1)
    
    warehouse = relationship("Warehouse", back_populates="stocks")
    
    __mapper_args__ = {
        "version_id_col": version_id
    }

class Reservation(Base):
    __tablename__ = "reservations"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    sku: Mapped[str] = mapped_column(String(255), nullable=False)
    warehouse_id: Mapped[str] = mapped_column(String(100), nullable=False)
    batch_id: Mapped[Optional[int]] = mapped_column(ForeignKey("batches.id"))
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PENDING")
    correlation_id: Mapped[str] = mapped_column(String(100), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

class InventoryLedger(Base):
    __tablename__ = "inventory_ledger"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    sku: Mapped[str] = mapped_column(String(255), nullable=False)
    warehouse_id: Mapped[str] = mapped_column(String(100), nullable=False)
    batch_id: Mapped[Optional[int]] = mapped_column(ForeignKey("batches.id"))
    change_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    correlation_id: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
