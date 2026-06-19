import requests

def test_get_orchestration_status_success():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/orchestration/status"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        # Validate status code
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        
        # Validate response content includes keys related to orchestration health or workflow status
        # This is a best effort check since exact schema details were not provided
        assert isinstance(data, dict), "Response is not a JSON object"
        assert any(key in data for key in ["health", "status", "workflow", "orchestration"]) or len(data) > 0,\
            "Response does not contain expected orchestration status information"
        
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_orchestration_status_success()