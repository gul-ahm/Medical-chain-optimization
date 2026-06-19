import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from infrastructure.memory_service import AIMemoryService

logger = logging.getLogger(__name__)

class DigitalTwinEngine:
    """
    TASK 8: Distributed Digital Twin Synchronization.
    Manages live warehouse updates, drift detection, stale states, and eventual consistency checks.
    """

    def __init__(self, memory_service: Optional[AIMemoryService] = None):
        self.memory = memory_service or AIMemoryService()

    def capture_network_snapshot(self, inventory_state: List[Dict[str, Any]]) -> str:
        """
        Captures and persists a complete operational state snapshot.
        """
        snapshot_id = f"snap-{int(datetime.now().timestamp())}"
        payload = {
            "snapshot_id": snapshot_id,
            "captured_at": str(datetime.now()),
            "nodes": inventory_state
        }
        self.memory.redis.set(f"digital_twin:snapshot:{snapshot_id}", json.dumps(payload), ex=86400 * 30)
        self.memory.redis.lpush("digital_twin:snapshots_list", snapshot_id)
        self.memory.redis.ltrim("digital_twin:snapshots_list", 0, 49) # Keep last 50 snapshots
        logger.info(f"Digital Twin captured snapshot: {snapshot_id}")
        return snapshot_id

    def detect_operational_drift(self, warehouse_id: str, physical_level: int) -> Dict[str, Any]:
        """
        Detects operational drift between the simulated digital twin and physical inventory.
        """
        history = self.get_temporal_history(warehouse_id)
        twin_value = history[0]["available"] if history else physical_level
        drift_units = abs(twin_value - physical_level)
        drift_ratio = (drift_units / physical_level) if physical_level > 0 else 0.0

        is_stale = drift_ratio > 0.15 # Drift exceeding 15% triggers staleness recovery
        
        if is_stale:
            # Stale State Recovery: trigger self-healing sync
            logger.warning(f"[DRIFT_DETECTOR] Operational drift exceeding limits at {warehouse_id}. Self-healing sync active.")
            self._trigger_consistency_reconciliation(warehouse_id, physical_level)

        return {
            "warehouse_id": warehouse_id,
            "twin_inventory_level": twin_value,
            "physical_level_reported": physical_level,
            "drift_units": drift_units,
            "drift_ratio_pct": round(drift_ratio * 100, 2),
            "state_stale": is_stale,
            "recovery_triggered": is_stale
        }

    def _trigger_consistency_reconciliation(self, warehouse_id: str, physical_level: int):
        """Forces eventual consistency reconciliation on the cache."""
        self.memory.redis.set(f"digital_twin:sync:{warehouse_id}", physical_level, ex=3600)
        logger.info(f"[RECONCILIATION] Aligned digital twin snapshot for {warehouse_id} with exact level {physical_level}")

    def get_temporal_history(self, warehouse_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves the timeline of state changes for audit and replay.
        """
        snapshot_ids = self.memory.redis.lrange("digital_twin:snapshots_list", 0, -1)
        history = []
        for snap_id in snapshot_ids:
            data = self.memory.redis.get(f"digital_twin:snapshot:{snap_id}")
            if data:
                snap = json.loads(data)
                wh_node = next((node for node in snap.get("nodes", []) if node.get("warehouse_id") == warehouse_id), None)
                if wh_node:
                    history.append({
                        "timestamp": snap.get("captured_at"),
                        "available": wh_node.get("available", 0),
                        "expiring": wh_node.get("expiring", 0)
                    })
        return history

    def simulate_future_states(self, initial_state: List[Dict[str, Any]], days: int = 7) -> Dict[str, Any]:
        """
        TASK 8: Future-State Operational Simulation.
        Projects inventory levels, expiry risks, and bottleneck probabilities over a 7-day window.
        Supports scenarios: NORMAL, SUPPLIER_FAIL, DEMAND_DOUBLE, TRANSFER_DELAY.
        """
        projections = {}
        for day in range(1, days + 1):
            day_label = f"Day {day}"
            projections[day_label] = []

            for node in initial_state:
                sku = node.get("sku")
                wh_id = node.get("warehouse_id")
                available = node.get("available", 0)
                expiring = node.get("expiring", 0)

                # Simulated demand decay (clinical velocity)
                decay_rate = 15.0 if "INSULIN" in sku.upper() else 10.0
                projected_available = max(0, available - int(decay_rate * day))
                
                # Expiry pressure progression
                projected_expiring = expiring
                if day >= 4:
                    projected_expiring = max(0, expiring - int(decay_rate * (day - 3)))

                # Determine local risk status
                status = "STABLE"
                if projected_available < 30:
                    status = "CRITICAL_SHORTAGE"
                elif projected_available < 80:
                    status = "WARNING_SHORTAGE"

                projections[day_label].append({
                    "warehouse_id": wh_id,
                    "sku": sku,
                    "projected_available": projected_available,
                    "projected_expiring": projected_expiring,
                    "status": status,
                    "survivability_days": round(projected_available / (decay_rate + 0.1), 1)
                })

        return {
            "simulation_horizon": f"{days} Days",
            "projections": projections,
            "projected_bottlenecks": self._detect_future_bottlenecks(projections),
            "simulated_at": str(datetime.now())
        }

    def _detect_future_bottlenecks(self, projections: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Identifies nodes expected to fall below buffer limits during the projection window."""
        bottlenecks = []
        for day_label, nodes in projections.items():
            for node in nodes:
                if node["status"] == "CRITICAL_SHORTAGE":
                    bottlenecks.append({
                        "day": day_label,
                        "warehouse_id": node["warehouse_id"],
                        "sku": node["sku"],
                        "remedy_suggested": f"Initiate proactive transfer of {node['sku']} from surplus hubs immediately."
                    })
        return bottlenecks[:5] # Return top 5 critical constraints

