import requests

def test_post_optimization_with_valid_payload():
    base_url = "http://localhost:3000"
    endpoint = "/api/optimize"
    url = base_url + endpoint
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        # Example valid optimization request payload
        "inventory": [
            {"item_id": "item001", "quantity": 100, "location": "warehouseA", "expiry_date": "2026-12-31"},
            {"item_id": "item002", "quantity": 50, "location": "warehouseB", "expiry_date": "2026-09-30"}
        ],
        "demand_forecast": [
            {"item_id": "item001", "required_quantity": 80, "location": "hospitalA"},
            {"item_id": "item002", "required_quantity": 40, "location": "hospitalB"}
        ],
        "constraints": {
            "max_transport_cost": 1000,
            "prioritize_fefo": True
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
        data = response.json()
        # Validate presence of key fields in optimized plan
        assert "optimized_plan" in data, "Response missing 'optimized_plan'"
        optimized_plan = data["optimized_plan"]
        assert isinstance(optimized_plan, list) and len(optimized_plan) > 0, "'optimized_plan' should be a non-empty list"

        # Check structure of first redistribution step if available
        first_step = optimized_plan[0]
        expected_keys = {"item_id", "quantity", "from_location", "to_location", "transport_cost"}
        assert expected_keys.issubset(first_step.keys()), f"First optimized plan step missing expected keys: {expected_keys}"

        # Ensure quantities and costs are positive numbers
        assert first_step["quantity"] > 0, "Quantity in optimized plan must be positive"
        assert first_step["transport_cost"] >= 0, "Transport cost must be zero or positive"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_optimization_with_valid_payload()