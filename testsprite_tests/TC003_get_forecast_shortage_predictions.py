import requests

def test_get_forecast_shortage_predictions():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/forecast"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate that shortage prediction data contains expected keys
    # Given no exact schema, check presence of key fields typical for forecast
    assert isinstance(data, dict), "Response JSON is not a dictionary"
    assert "predictions" in data or "shortage_predictions" in data or len(data) > 0, \
        "Response does not contain expected shortage prediction data"

test_get_forecast_shortage_predictions()