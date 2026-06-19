import json
from pathlib import Path
from typing import List, Dict

class ForecastDetector:
    def __init__(self, inventory_path: str):
        with open(inventory_path, 'r') as f:
            self.inventory = json.load(f)

    def detect_forecasting_ready(self) -> List[Dict]:
        ready_datasets = []
        for file_name, meta in self.inventory.items():
            cols = meta.get("columns", [])
            # Heuristic for forecasting: Needs a date/time and a numeric value (quantity/price/sales)
            has_date = len(meta.get("date_fields", [])) > 0
            has_numeric = len(meta.get("monetary_fields", [])) > 0 or len(meta.get("inventory_fields", [])) > 0
            
            if has_date and has_numeric:
                ready_datasets.append({
                    "dataset": file_name,
                    "date_columns": meta.get("date_fields"),
                    "target_columns": meta.get("monetary_fields") + meta.get("inventory_fields"),
                    "row_count": meta.get("row_count")
                })
        return ready_datasets

if __name__ == "__main__":
    detector = ForecastDetector("e:/power bi/audit_report/dataset_inventory.json")
    ready = detector.detect_forecasting_ready()
    print("Forecasting Ready Datasets:")
    for r in ready:
        print(f"- {r['dataset']} ({r['row_count']} rows). Targets: {r['target_columns']}")
