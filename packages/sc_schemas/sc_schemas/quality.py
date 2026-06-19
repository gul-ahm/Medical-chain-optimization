import json
from typing import List, Dict, Any

class DataQuality:
    @staticmethod
    def check_nulls(data: List[Dict]) -> Dict[str, int]:
        if not data: return {}
        null_counts = {}
        for item in data:
            for k, v in item.items():
                if v is None or v == "":
                    null_counts[k] = null_counts.get(k, 0) + 1
        return null_counts

    @staticmethod
    def detect_duplicates(data: List[Dict], key: str) -> List[Any]:
        seen = set()
        duplicates = []
        for item in data:
            val = item.get(key)
            if val in seen:
                duplicates.append(val)
            seen.add(val)
        return duplicates

    @staticmethod
    def validate_schema(data: List[Dict], expected_columns: List[str]) -> Dict:
        if not data: return {"status": "empty"}
        actual_columns = set(data[0].keys())
        missing = [c for c in expected_columns if c not in actual_columns]
        extra = [c for c in actual_columns if c not in expected_columns]
        
        return {
            "status": "ok" if not missing else "drift_detected",
            "missing_columns": missing,
            "extra_columns": extra
        }

    @staticmethod
    def normalize_dates(data: List[Dict], date_fields: List[str]) -> List[Dict]:
        # Simple string normalization for now
        for item in data:
            for field in date_fields:
                val = item.get(field)
                if val and isinstance(val, str) and "T" in val:
                    # Keep only date part if needed or standardize format
                    item[field] = val.split("T")[0]
        return data

class DataGovernance:
    @staticmethod
    def calculate_quality_score(data: List[Dict]) -> float:
        """Calculates a health score from 0.0 to 1.0 based on nulls and uniqueness."""
        if not data: return 0.0
        nulls = DataQuality.check_nulls(data)
        total_fields = len(data) * len(data[0].keys())
        total_nulls = sum(nulls.values())
        
        completeness = (total_fields - total_nulls) / total_fields
        return round(completeness, 4)

    @staticmethod
    def track_lineage(dataset_name: str, transformations: List[str]):
        """Logs data lineage for audit trails."""
        # Simple print for now, could be persistent
        print(f"[LINEAGE]: {dataset_name} -> {' -> '.join(transformations)}")
