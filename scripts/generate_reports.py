import json
import os

def generate_reports():
    report_dir = "e:/power bi/audit_report"
    os.makedirs(report_dir, exist_ok=True)
    
    # 1. Dataset Inventory (already exists, but let's summarize it)
    with open(os.path.join(report_dir, "dataset_inventory.json"), 'r') as f:
        inventory = json.load(f)
        
    summary = {
        "total_datasets": len(inventory),
        "formats": ["json"],
        "total_rows": sum(m.get("row_count", 0) for m in inventory.values() if "row_count" in m)
    }
    
    # 2. Relationship Diagram (Mermaid)
    mermaid = "graph TD\n"
    # Detect relations based on ID fields
    id_map = {} # id_name -> [datasets]
    for ds, meta in inventory.items():
        for col in meta.get("id_fields", []):
            if col not in id_map: id_map[col] = []
            id_map[col].append(ds)
            
    for id_col, datasets in id_map.items():
        if len(datasets) > 1:
            for i in range(len(datasets)):
                for j in range(i+1, len(datasets)):
                    mermaid += f"  {datasets[i].replace('.json','')} -- {id_col} -- {datasets[j].replace('.json','')}\n"
    
    with open(os.path.join(report_dir, "relationship_diagram.mmd"), 'w') as f:
        f.write(mermaid)
        
    # 3. Architecture Update Report
    update_report = """# Architecture Update Report: Schema-Adaptive Engine

## Summary
The platform has been upgraded to support dynamic, schema-adaptive data processing. This allows newly uploaded medical datasets to be integrated without manual code changes.

## New Components
- **Canonical Mapping Layer**: `packages/sc_schemas/sc_schemas/metadata/schema_mapping.json`
- **Dynamic Data Engine**: `packages/sc_schemas/sc_schemas/data_engine.py`
- **Data Quality Pipeline**: `packages/sc_schemas/sc_schemas/quality.py`
- **AI/RAG Semantic Layer**: `packages/sc_schemas/sc_schemas/rag_prep.py`

## Refactoring Recommendations
- Transition all `SKU` references to `product_id`.
- Use the `DataEngine` in all microservices instead of direct file I/O.
- Implement the `DataQuality` checks in the Kafka ingestion pipelines.

## Scalability
The system now supports any number of JSON datasets. Future support for CSV and Parquet can be added by extending the `DataEngine.load_dataset` method.
"""
    with open(os.path.join(report_dir, "architecture_update.md"), 'w') as f:
        f.write(update_report)

    print(f"Reports generated in {report_dir}")

if __name__ == "__main__":
    generate_reports()
