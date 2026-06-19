from typing import List, Dict, Any
from datetime import datetime, timedelta

class ShortageEngine:
    def __init__(self, inventory_data: List[Dict]):
        self.data = inventory_data

    def analyze_shortages(self, threshold_days: int = 7) -> List[Dict]:
        """Predicts medicine shortages based on current stock and daily demand."""
        alerts = []
        for item in self.data:
            sku = item.get("product_id")
            stock = item.get("quantity", 0)
            
            # Simple heuristic for daily demand (could be fetched from forecasting)
            # For simulation, we'll assume a random daily demand between 5 and 20
            daily_demand = item.get("daily_demand", 10) 
            
            days_remaining = stock / daily_demand if daily_demand > 0 else 999
            
            if days_remaining <= threshold_days:
                alerts.append({
                    "sku": sku,
                    "medicine_name": item.get("medicine_name", f"Medicine-{sku}"),
                    "current_stock": stock,
                    "days_remaining": round(days_remaining, 1),
                    "urgency": "CRITICAL" if days_remaining < 2 else "HIGH",
                    "reason": "Stock exhaustion imminent",
                    "impact": "Clinical supply disruption"
                })
        return alerts

    def analyze_expiry_risk(self, window_days: int = 30) -> List[Dict]:
        """Identifies medicines nearing expiry."""
        risks = []
        now = datetime.now()
        for item in self.data:
            expiry_str = item.get("expiry_date")
            if not expiry_str: continue
            
            expiry_date = datetime.fromisoformat(expiry_str)
            days_to_expiry = (expiry_date - now).days
            
            if days_to_expiry <= window_days:
                risks.append({
                    "sku": item.get("product_id"),
                    "medicine_name": item.get("medicine_name"),
                    "expiry_date": expiry_str,
                    "days_to_expiry": days_to_expiry,
                    "urgency": "CRITICAL" if days_to_expiry < 7 else "MEDIUM",
                    "recommendation": "Prioritize usage or redistribute"
                })
        return risks
