import os
import json
from pathlib import Path

def get_type(val):
    if val is None: return "null"
    if isinstance(val, bool): return "boolean"
    if isinstance(val, int): return "integer"
    if isinstance(val, float): return "float"
    if isinstance(val, str):
        if "-" in val and ":" in val and ("T" in val or " " in val): return "datetime"
        return "string"
    return "object"

def audit_datasets(data_dir):
    audit_results = {}
    data_path = Path(data_dir)
    
    for file_path in data_path.glob("*.json"):
        file_name = file_path.name
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    audit_results[file_name] = {"status": "empty"}
                    continue
                data = json.loads(content)
            
            items = []
            if isinstance(data, list):
                items = data
            elif isinstance(data, dict):
                # Look for typical OData/REST wrappers
                if "value" in data and isinstance(data["value"], list):
                    items = data["value"]
                else:
                    items = [data]
            
            if not items:
                audit_results[file_name] = {"row_count": 0, "columns": []}
                continue

            row_count = len(items)
            first_row = items[0]
            columns = list(first_row.keys())
            dtypes = {col: get_type(first_row[col]) for col in columns}
            
            # Identify types
            date_fields = [col for col in columns if 'date' in col.lower() or 'time' in col.lower() or dtypes[col] == "datetime"]
            id_fields = [col for col in columns if 'id' in col.lower()]
            monetary_fields = [col for col in columns if any(k in col.lower() for k in ['price', 'unitcost', 'revenue', 'total', 'amount', 'freight'])]
            inventory_fields = [col for col in columns if any(k in col.lower() for k in ['stock', 'quantity', 'reorder', 'unitson'])]

            audit_results[file_name] = {
                "row_count": row_count,
                "columns": columns,
                "dtypes": dtypes,
                "date_fields": date_fields,
                "id_fields": id_fields,
                "monetary_fields": monetary_fields,
                "inventory_fields": inventory_fields,
                "sample": first_row
            }
        except Exception as e:
            audit_results[file_name] = {"status": "error", "error": str(e)}

    return audit_results

if __name__ == "__main__":
    results = audit_datasets("e:/power bi/NorthwindData")
    output_path = "e:/power bi/audit_report/dataset_inventory.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Audit complete. Results saved to {output_path}")
