import json
from typing import List, Dict

class SemanticTagger:
    def __init__(self, semantic_dict_path: str, mapping_path: str):
        with open(semantic_dict_path, 'r') as f:
            self.semantic_dict = json.load(f)
        with open(mapping_path, 'r') as f:
            self.mapping = json.load(f)

    def tag_item(self, item: Dict, dataset_name: str) -> Dict:
        """Adds deep operational and semantic metadata to a data item."""
        tags = []
        
        # 1. Classification & Domain Tags
        ds_meta = self.mapping.get("datasets", {}).get(dataset_name, {})
        tags.append(f"type:{ds_meta.get('classification', 'unknown')}")
        
        if "medicine_name" in item:
            tags.append(f"entity:medicine")
            tags.append(f"class:{item.get('drug_class')}")
        if "hospital_name" in item:
            tags.append(f"entity:hospital")
        
        # 2. Risk & Operational Tags
        if item.get("quantity", 0) < 50:
            tags.append("risk:low_stock")
        if "expiry_date" in item:
             from datetime import datetime
             days = (datetime.fromisoformat(item["expiry_date"]) - datetime.now()).days
             if days < 60:
                 tags.append("risk:expiring_soon")

        # 3. Clinical Context
        context = self.semantic_dict.get("medical_context", {})
        for term, description in context.items():
            if term in dataset_name.lower() or term in str(item).lower():
                tags.append(f"context:{term}")
        
        item["_semantic_tags"] = list(set(tags))
        return item

    def prepare_for_rag(self, data: List[Dict], dataset_name: str) -> List[Dict]:
        return [self.tag_item(item, dataset_name) for item in data]
