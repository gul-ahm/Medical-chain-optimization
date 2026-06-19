import networkx as nx
import structlog
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import Column, String, JSON, Integer, DateTime
from services.api.db.session import Base, async_session_factory

logger = structlog.get_logger(__name__)

class LineageRecordModel(Base):
    """
    Persistent store for data lineage relationships.
    """
    __tablename__ = "data_lineage"
    
    id = Column(Integer, primary_key=True)
    source_urn = Column(String, index=True, nullable=False)
    target_urn = Column(String, index=True, nullable=False)
    transformation_type = Column(String, nullable=False) # e.g. "AGGREGATE", "FEATURE_ENG"
    metadata_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class DataLineageTracker:
    """
    Enterprise Data Lineage & Provenance Tracker.
    Maps relationships between raw data sources, ML features, and analytical dashboards.
    """
    def __init__(self):
        self.graph = nx.DiGraph()

    async def track_lineage(self, source: str, target: str, transform: str, metadata: Optional[Dict[str, Any]] = None):
        """
        Records a new lineage relationship between a source and target URN.
        URN Example: "lakehouse:raw:inventory", "feature:sku_velocity"
        """
        logger.info("recording_data_lineage", source=source, target=target, type=transform)
        
        # 1. Update In-Memory Graph
        self.graph.add_edge(source, target, transform=transform, timestamp=datetime.utcnow().isoformat())
        
        # 2. Persist to DB
        async with async_session_factory() as session:
            record = LineageRecordModel(
                source_urn=source,
                target_urn=target,
                transformation_type=transform,
                metadata_json=metadata
            )
            session.add(record)
            await session.commit()

    def get_impact_analysis(self, source_urn: str) -> List[str]:
        """
        Identifies all downstream entities affected by changes in the specified source dataset.
        """
        if source_urn not in self.graph:
            return []
        # Return all descendants in the Directed Acyclic Graph
        return list(nx.descendants(self.graph, source_urn))

    def get_provenance(self, target_urn: str) -> List[str]:
        """
        Retrieves the full upstream lineage for a specific dataset or feature.
        """
        if target_urn not in self.graph:
            return []
        return list(nx.ancestors(self.graph, target_urn))

# ── Singleton Instance ──
lineage_tracker = DataLineageTracker()
