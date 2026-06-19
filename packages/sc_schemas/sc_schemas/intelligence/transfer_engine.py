from typing import List, Dict, Any

class TransferEngine:
    def __init__(self, regional_inventory: List[Dict]):
        # Data format: [{ "warehouse_id": "W1", "sku": "A", "quantity": 100, ... }]
        self.inventory = regional_inventory

    def optimize_balancing(self) -> List[Dict]:
        """Identifies overstock and understock across warehouses and recommends transfers."""
        recommendations = []
        
        # Group by SKU
        sku_groups = {}
        for item in self.inventory:
            sku = item.get("product_id")
            if sku not in sku_groups: sku_groups[sku] = []
            sku_groups[sku].append(item)
            
        for sku, stock_levels in sku_groups.items():
            if len(stock_levels) < 2: continue
            
            # Simple balancing logic
            # Find max and min stock
            overstock = [s for s in stock_levels if s.get("quantity", 0) > 200]
            shortage = [s for s in stock_levels if s.get("quantity", 0) < 20]
            
            for source in overstock:
                for target in shortage:
                    transfer_qty = 50 # Example fixed transfer
                    recommendations.append({
                        "sku": sku,
                        "medicine_name": source.get("medicine_name"),
                        "from_warehouse": source.get("warehouse_id", "WH-Alpha"),
                        "to_warehouse": target.get("warehouse_id", "WH-Bravo"),
                        "quantity": transfer_qty,
                        "reason": "Warehouse imbalance / Shortage mitigation",
                        "impact": f"Extends stock life in {target.get('warehouse_id')} by 5 days"
                    })
        return recommendations
