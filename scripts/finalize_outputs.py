import json
import os

def finalize_expected_outputs():
    # 1. relationship_registry.json
    # Based on our join detection logic
    registry = {
        "joins": [
            {"tables": ["Products", "Order_Details"], "key": "ProductID"},
            {"tables": ["Products", "Categories"], "key": "CategoryID"},
            {"tables": ["Products", "Suppliers"], "key": "SupplierID"},
            {"tables": ["Orders", "Order_Details"], "key": "OrderID"},
            {"tables": ["Orders", "Customers"], "key": "CustomerID"},
            {"tables": ["Orders", "Employees"], "key": "EmployeeID"},
            {"tables": ["Invoices", "Orders"], "key": "OrderID"}
        ],
        "primary_keys": {
            "Products.json": "ProductID",
            "Orders.json": "OrderID",
            "Customers.json": "CustomerID",
            "Employees.json": "EmployeeID",
            "Categories.json": "CategoryID",
            "Suppliers.json": "SupplierID"
        }
    }
    
    metadata_dir = "e:/power bi/packages/sc_schemas/sc_schemas/metadata"
    os.makedirs(metadata_dir, exist_ok=True)
    with open(os.path.join(metadata_dir, "relationship_registry.json"), "w") as f:
        json.dump(registry, f, indent=2)

    # 2. dataset_inventory.md
    with open("e:/power bi/audit_report/dataset_inventory.json", "r") as f:
        inventory = json.load(f)
        
    md_content = "# Dataset Inventory\n\n"
    md_content += "| Dataset | Rows | Columns | Classification |\n"
    md_content += "|---------|------|---------|----------------|\n"
    
    for name, meta in inventory.items():
        rows = meta.get("row_count", 0)
        cols = len(meta.get("columns", []))
        # Simple classification logic
        cls = "Master" if "ProductID" in meta.get("columns", []) or "CustomerID" in meta.get("columns", []) else "Transaction/View"
        if "OrderID" in meta.get("columns", []) and "ProductID" in meta.get("columns", []): cls = "Transaction"
        
        md_content += f"| {name} | {rows} | {cols} | {cls} |\n"
        
    with open("e:/power bi/audit_report/dataset_inventory.md", "w") as f:
        f.write(md_content)

    print("Final expected outputs generated.")

if __name__ == "__main__":
    finalize_expected_outputs()
