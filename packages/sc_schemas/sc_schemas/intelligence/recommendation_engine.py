from typing import List, Dict, Any
from sc_schemas.intelligence.shortage_engine import ShortageEngine
from sc_schemas.intelligence.transfer_engine import TransferEngine

class RecommendationEngine:
    def __init__(self, data_engine):
        self.data_engine = data_engine

    def get_proactive_recommendations(self) -> List[Dict[str, Any]]:
        """Aggregates intelligence from multiple engines to provide unified recommendations."""
        inventory = self.data_engine.load_dataset("Products.json", medical_transform=True)
        
        # 1. Shortage analysis
        short_engine = ShortageEngine(inventory)
        shortages = short_engine.analyze_shortages()
        
        # 2. Transfer analysis (simulation with dummy regional data)
        regional_data = inventory # In real app, this would be multi-warehouse
        trans_engine = TransferEngine(regional_data)
        transfers = trans_engine.optimize_balancing()
        
        recommendations = []
        
        for s in shortages:
            recommendations.append({
                "type": "REORDER",
                "medicine": s["medicine_name"],
                "action": f"Initiate emergency procurement for {s['medicine_name']}",
                "reason": s["reason"],
                "urgency": s["urgency"],
                "impact": s["impact"]
            })
            
        for t in transfers:
             recommendations.append({
                "type": "TRANSFER",
                "medicine": t["medicine_name"],
                "action": f"Transfer {t['quantity']} units from {t['from_warehouse']} to {t['to_warehouse']}",
                "reason": t["reason"],
                "urgency": "MEDIUM",
                "impact": t["impact"]
            })
            
        return recommendations
