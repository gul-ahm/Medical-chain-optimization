import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class NetworkSurvivabilityEngine:
    """
    TASK 2: Network-Wide Supply Survivability Engine.
    Evaluates systemic risks and cascading shortage propagation across the warehouse fleet.
    """

    def calculate_regional_survivability(self, inventory_state: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes the entire network to identify vulnerable clusters and propagation risks.
        """
        regional_scores = {}
        propagation_risk = []
        
        # 1. Group by Region (Mocked based on warehouse IDs)
        # WH-REG-001 -> North, WH-REG-002 -> South, etc.
        regions = {
            "NORTH": ["WH-REG-001", "WH-IND-001"],
            "SOUTH": ["WH-REG-002", "WH-IND-002"],
            "EAST": ["WH-REG-003"],
            "WEST": ["WH-REG-004"]
        }
        
        for region_name, wh_list in regions.items():
            wh_data = [i for i in inventory_state if i.get("wh_id") in wh_list]
            
            if not wh_data:
                regional_scores[region_name] = 100 # Default if no data
                continue
                
            # Calculate Survivability (Average stock vs Buffer)
            total_available = sum([i.get("available", 0) for i in wh_data])
            avg_stock = total_available / len(wh_data)
            
            # Simple thresholding
            score = min(100, (avg_stock / 200) * 100)
            regional_scores[region_name] = round(score, 2)
            
            # Identify Propagation Risks (If a region is low, it drains neighbors)
            if score < 40:
                propagation_risk.append({
                    "source_region": region_name,
                    "target_regions": ["ADJACENT_CLUSTERS"],
                    "severity": "CRITICAL" if score < 20 else "HIGH",
                    "reason": f"Low stock in {region_name} will force emergency redistribution from neighboring regions."
                })

        return {
            "regional_survivability": regional_scores,
            "network_vulnerability_index": round(sum(regional_scores.values()) / len(regional_scores), 2),
            "propagation_risks": propagation_risk,
            "cascading_failure_prediction": self._model_cascading_failure(regional_scores)
        }

    def _model_cascading_failure(self, scores: Dict[str, float]) -> List[str]:
        """Models potential ripple effects if a region fails."""
        failures = []
        if scores.get("NORTH", 100) < 30:
            failures.append("North Region failure will trigger inventory drain in East and South clusters.")
        if scores.get("SOUTH", 100) < 30:
            failures.append("South Region shortage will impact Central logistics hubs due to rerouted transit paths.")
        return failures
