import requests

def test_get_live_inventory_status_and_warehouse_utilization():
    # 1. Query the live inventory service stock endpoint (port 8001)
    inventory_service_url = "http://localhost:8001/api/v1/inventory/stock"
    timeout = 30
    
    print(f"Querying live inventory service stock at {inventory_service_url}...")
    try:
        response = requests.get(inventory_service_url, timeout=timeout)
        assert response.status_code == 200, f"Expected 200 from inventory stock endpoint, got {response.status_code}"
        
        json_data = response.json()
        assert "data" in json_data, "Response missing 'data' wrapper"
        stocks = json_data["data"]
        assert isinstance(stocks, list), f"Expected stock data to be a list, got {type(stocks)}"
        
        # Verify that we got some stock records
        assert len(stocks) > 0, "Expected at least one stock record in the database"
        for item in stocks:
            assert "sku" in item, "Stock item missing 'sku'"
            assert "warehouse_id" in item, "Stock item missing 'warehouse_id'"
            assert "available" in item, "Stock item missing 'available'"
            assert "reserved" in item, "Stock item missing 'reserved'"
            assert "quarantine" in item, "Stock item missing 'quarantine'"
            assert "expiring" in item, "Stock item missing 'expiring'"
            
        print("Live inventory service stock check passed!")
    except Exception as e:
        assert False, f"Failed verifying live inventory service: {e}"

    # 2. Query the Next.js precalculated dashboard endpoint (port 3000)
    dashboard_url = "http://localhost:3000/api/dashboard/inventory"
    print(f"Querying Next.js dashboard inventory API at {dashboard_url}...")
    try:
        response = requests.get(dashboard_url, timeout=timeout)
        assert response.status_code == 200, f"Expected 200 from dashboard inventory API, got {response.status_code}"
        
        json_data = response.json()
        assert json_data.get("success") is True, f"Expected success to be True, got {json_data.get('success')}"
        assert "data" in json_data, "Response missing 'data' key"
        
        data = json_data["data"]
        # Verify warehouse capacity utilization configuration
        assert "warehouses" in data, "Dashboard data missing 'warehouses'"
        warehouses = data["warehouses"]
        assert isinstance(warehouses, list), f"Expected warehouses to be a list, got {type(warehouses)}"
        assert len(warehouses) > 0, "Expected at least one warehouse entry in precalculated dashboard"
        
        for w in warehouses:
            assert "id" in w, "Warehouse missing 'id'"
            assert "capacity" in w, "Warehouse missing 'capacity'"
            assert "used" in w, "Warehouse missing 'used'"
            assert "status" in w, "Warehouse missing 'status'"
            
        # Verify summary KPIs
        assert "summary" in data, "Dashboard data missing 'summary'"
        summary = data["summary"]
        assert "availableStock" in summary, "Summary missing 'availableStock'"
        assert "reservedStock" in summary, "Summary missing 'reservedStock'"
        assert "quarantineCount" in summary, "Summary missing 'quarantineCount'"
        
        print("Next.js dashboard inventory API check passed!")
    except Exception as e:
        assert False, f"Failed verifying Next.js dashboard API: {e}"

    print("TC011 Backend verification passed successfully!")

if __name__ == "__main__":
    test_get_live_inventory_status_and_warehouse_utilization()
