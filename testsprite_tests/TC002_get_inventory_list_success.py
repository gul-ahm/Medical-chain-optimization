import requests

def test_get_inventory_list_success():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/inventory"
    timeout = 30
    headers = {
        "Accept": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, timeout=timeout)
    except requests.RequestException as e:
        assert False, f"Request to /api/inventory failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(data, list), f"Expected response body to be a list, got {type(data)}"

    for item in data:
        assert isinstance(item, dict), "Each inventory item should be a dictionary"
        # Optionally, verify typical keys presence
        # Common keys could be id, name, quantity, state (if known)
        # We check at least 'id' and 'state' or 'quantity' are present if relevant
        # Since schema is not explicitly detailed, check each has at least one key
        assert len(item) > 0, "Inventory item should have at least one attribute"

test_get_inventory_list_success()