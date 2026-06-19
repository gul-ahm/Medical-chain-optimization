import uuid
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy import Column, String, Float, DateTime, Integer, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = Column(String, nullable=False, index=True)
    warehouse_id = Column(String, nullable=False, index=True)
    target_date = Column(DateTime(timezone=True), nullable=False)
    predicted_demand = Column(Float, nullable=False)
    confidence_lower = Column(Float, nullable=False)
    confidence_upper = Column(Float, nullable=False)
    model_version = Column(String, nullable=False)
    ensemble_weights = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class DriftReport(Base):
    __tablename__ = "drift_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = Column(String, nullable=False)
    warehouse_id = Column(String, nullable=False)
    metric = Column(String, nullable=False) # e.g., "MAPE", "KL_DIVERGENCE"
    value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    detected_at = Column(DateTime(timezone=True), default=datetime.utcnow)
