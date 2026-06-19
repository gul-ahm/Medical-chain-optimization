import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class OptimizationRecommendation(Base):
    __tablename__ = "optimization_recommendations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_id = Column(String, index=True)
    sku = Column(String, nullable=False)
    source_warehouse = Column(String, nullable=False)
    destination_warehouse = Column(String, nullable=False)
    recommended_transfer_qty = Column(Integer, nullable=False)
    confidence_score = Column(Float, nullable=False)
    cost_reduction = Column(Float, nullable=False)
    status = Column(String, default="PENDING_APPROVAL") # PENDING_APPROVAL, APPROVED, REJECTED, EXECUTED
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class SimulationScenario(Base):
    __tablename__ = "simulation_scenarios"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    parameters = Column(JSON, nullable=False)
    outcomes = Column(JSON, nullable=False)
    executed_at = Column(DateTime(timezone=True), default=datetime.utcnow)
