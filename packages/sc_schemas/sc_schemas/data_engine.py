import json
import os
import random
from pathlib import Path
from typing import List, Dict, Any, Optional

from sc_schemas.config import ConfigRegistry

class DataEngine:
    def __init__(self, data_dir: Optional[Path] = None, metadata_dir: Optional[Path] = None):
        self.data_dir = data_dir or ConfigRegistry.DATA_ROOT
        self.metadata_dir = metadata_dir or ConfigRegistry.METADATA_ROOT
        self.mapping = self._load_json(self.metadata_dir / "schema_mapping.json")
        self.inventory = self._load_json(ConfigRegistry.REPORT_ROOT / "dataset_inventory.json")

    def _load_json(self, path: Path) -> Dict:
        if not path.exists():
            return {}
        with open(path, 'r') as f:
            return json.load(f)

    def _fuzzy_match(self, target: str, candidates: List[str], threshold: float = 0.8) -> Optional[str]:
        """Simple sequence-based fuzzy matcher."""
        import difflib
        matches = difflib.get_close_matches(target, candidates, n=1, cutoff=threshold)
        return matches[0] if matches else None

    def get_canonical_column(self, dataset_name: str, canonical_key: str) -> Optional[str]:
        """Finds the actual column name for a given canonical key in a dataset with fuzzy support."""
        dataset_meta = self.inventory.get(dataset_name)
        if not dataset_meta:
            return None
        
        dataset_cols = dataset_meta.get("columns", [])
        variations = self.mapping.get("fields", {}).get(canonical_key, [])
        
        # 1. Exact match in variations
        for variation in variations:
            if variation in dataset_cols:
                return variation
                
        # 2. Fuzzy match against variations
        for variation in variations:
            match = self._fuzzy_match(variation.lower(), [c.lower() for c in dataset_cols])
            if match:
                # Find original casing
                for c in dataset_cols:
                    if c.lower() == match:
                        return c
                        
        # 3. Direct fuzzy match against canonical_key
        match = self._fuzzy_match(canonical_key.lower(), [c.lower() for c in dataset_cols])
        if match:
             for c in dataset_cols:
                if c.lower() == match:
                    return c

        return None

    def load_dataset(self, dataset_name: str, apply_mapping: bool = True, medical_transform: bool = False) -> List[Dict]:
        """Loads a dataset, optionally renames columns and applies medical domain transformation."""
        file_path = self.data_dir / dataset_name
        if not file_path.exists():
            return []
            
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        items = []
        if isinstance(data, list):
            items = data
        elif isinstance(data, dict):
            if "value" in data:
                items = data["value"]
            else:
                items = [data]
        
        # Mapping logic
        reverse_map = {}
        if apply_mapping:
            for c_key, variations in self.mapping.get("fields", {}).items():
                for var in variations:
                    reverse_map[var] = c_key
        
        from sc_schemas.domain_transformation import MedicalDomainTransformer
        
        mapped_items = []
        for item in items:
            new_item = {}
            for k, v in item.items():
                mapped_key = reverse_map.get(k, k)
                new_item[mapped_key] = v
            
            if medical_transform:
                # Apply domain branding
                if "product_name" in new_item:
                    trans = MedicalDomainTransformer.transform_product(new_item["product_name"])
                    new_item.update(trans)
                if "customer_id" in new_item:
                    new_item["hospital_name"] = MedicalDomainTransformer.transform_customer(new_item["customer_id"])
                if "supplier_id" in new_item:
                    new_item["vendor_name"] = MedicalDomainTransformer.transform_supplier(new_item["supplier_id"])
                # Add fake expiry for simulation if not present
                if "product_id" in new_item and "expiry_date" not in new_item:
                    from datetime import datetime, timedelta
                    new_item["expiry_date"] = (datetime.now() + timedelta(days=random.randint(30, 730))).isoformat()
            
            mapped_items.append(new_item)
        return mapped_items

    def detect_relationships(self, dataset_a: str, dataset_b: str) -> List[Dict[str, Any]]:
        """Advanced relationship discovery between datasets with confidence scoring."""
        cols_a = self.inventory.get(dataset_a, {}).get("columns", [])
        cols_b = self.inventory.get(dataset_b, {}).get("columns", [])
        
        relationships = []
        
        for ca in cols_a:
            for cb in cols_b:
                confidence = 0.0
                rel_type = "unknown"
                
                # 1. Exact Name Match
                if ca.lower() == cb.lower():
                    confidence = 1.0
                    rel_type = "id_match" if "id" in ca.lower() else "semantic_match"
                
                # 2. Fuzzy Name Match
                elif self._fuzzy_match(ca.lower(), [cb.lower()], threshold=0.85):
                    confidence = 0.85
                    rel_type = "fuzzy_match"
                
                if confidence > 0.0:
                    relationships.append({
                        "source_col": ca,
                        "target_col": cb,
                        "confidence": confidence,
                        "type": rel_type
                    })
                    
        return sorted(relationships, key=lambda x: x["confidence"], reverse=True)

    def list_datasets(self, classification: str = None) -> List[str]:
        """Lists available datasets, optionally filtered by classification."""
        datasets = self.mapping.get("datasets", {})
        if not classification:
            return list(datasets.keys())
        return [k for k, v in datasets.items() if v.get("classification") == classification]

# Reusable Instance
engine = DataEngine()
