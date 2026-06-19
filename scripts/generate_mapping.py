import json
import os

def generate_canonical_mapping(inventory_path):
    with open(inventory_path, 'r') as f:
        inventory = json.load(f)
    
    mapping = {
        "fields": {},
        "datasets": {}
    }
    
    # Common canonical keys
    canonical_keys = {
        "product_id": ["ProductID", "product_id", "productid"],
        "product_name": ["ProductName", "product_name", "productname"],
        "supplier_id": ["SupplierID", "supplier_id", "supplierid"],
        "category_id": ["CategoryID", "category_id", "categoryid"],
        "customer_id": ["CustomerID", "customer_id", "customerid"],
        "order_id": ["OrderID", "order_id", "orderid"],
        "employee_id": ["EmployeeID", "employee_id", "employeeid"],
        "unit_price": ["UnitPrice", "unit_price", "unitprice", "Price"],
        "quantity": ["Quantity", "quantity", "Qty", "UnitsInStock"],
        "order_date": ["OrderDate", "order_date", "orderdate"],
        "ship_country": ["ShipCountry", "ship_country", "country"],
        "ship_city": ["ShipCity", "ship_city", "city"]
    }
    
    for c_key, variations in canonical_keys.items():
        mapping["fields"][c_key] = list(set(variations))
        
    for file_name, meta in inventory.items():
        if "columns" not in meta: continue
        
        # Classification
        classification = "reference"
        cols = [c.lower() for c in meta["columns"]]
        if "orderid" in cols and "productid" in cols:
            classification = "transaction"
        elif "orderid" in cols:
            classification = "transaction"
        elif "productid" in cols:
            classification = "master"
        elif "customerid" in cols:
            classification = "master"
            
        mapping["datasets"][file_name] = {
            "classification": classification,
            "columns": meta["columns"],
            "pk": meta.get("pk_candidates", [])[:1]
        }
        
    return mapping

if __name__ == "__main__":
    mapping = generate_canonical_mapping("e:/power bi/audit_report/dataset_inventory.json")
    output_dir = "e:/power bi/packages/sc_schemas/sc_schemas/metadata"
    os.makedirs(output_dir, exist_ok=True)
    with open(os.path.join(output_dir, "schema_mapping.json"), "w") as f:
        json.dump(mapping, f, indent=2)
    
    # Semantic dictionary
    semantic_dict = {
        "medical_context": {
            "product": "Medicines, clinical supplies, pharmaceuticals",
            "stock": "Clinical inventory, pharmacy stock levels",
            "order": "Supply procurement, hospital requisition",
            "supplier": "Pharmaceutical distributor, clinical vendor"
        },
        "definitions": {
            "reorder_point": "The inventory level at which a new clinical supply requisition must be initiated.",
            "lead_time": "The duration between supply requisition and pharmacy delivery."
        }
    }
    with open(os.path.join(output_dir, "semantic_dictionary.json"), "w") as f:
        json.dump(semantic_dict, f, indent=2)
    
    print(f"Schema mapping and semantic dictionary generated in {output_dir}")
