import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

class ForecastEngine:
    def __init__(self, historical_data: List[Dict]):
        self.history = historical_data

    def generate_medicine_forecast(self, sku: str, horizon_days: int = 30) -> Dict[str, Any]:
        """Generates an explainable forecast for a specific medicine."""
        # Mock logic based on 'historical_data'
        base_demand = 15
        growth_rate = 1.02 # 2% growth
        
        forecast = []
        now = datetime.now()
        
        explanation = [
            "Historical seasonal spike in Antibiotics detected for Q2",
            "Population growth in Metropolitan area driving demand (+2%)",
            "Clinical protocol update increasing dosage frequency"
        ]
        
        for i in range(horizon_days):
            date = (now + timedelta(days=i)).isoformat()
            # Add some seasonality/noise
            noise = random.uniform(0.9, 1.1)
            predicted = base_demand * (growth_rate ** (i/7)) * noise
            
            forecast.append({
                "date": date,
                "predicted_demand": round(predicted, 2)
            })
            
        return {
            "sku": sku,
            "forecast": forecast,
            "explanation": explanation,
            "confidence_level": 0.89,
            "anomalies_detected": ["None in next 14 days"]
        }
