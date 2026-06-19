import requests
import uuid
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_log_error_with_valid_payload():
    url = f"{BASE_URL}/log-error"
    # Construct a realistic valid error payload to simulate system error reporting
    error_payload = {
        "errorId": str(uuid.uuid4()),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "service": "inventory-service",
        "severity": "error",
        "message": "Inventory sync failed due to DB timeout",
        "details": {
            "dbQuery": "SELECT * FROM inventory WHERE status='active'",
            "timeoutSeconds": 30,
            "retryCount": 3
        },
        "environment": "production",
        "host": "host-1234",
        "tags": ["sync", "database", "timeout"]
    }

    try:
        response = requests.post(url, json=error_payload, timeout=TIMEOUT)
        assert response.status_code in (200, 202), f"Unexpected status code: {response.status_code}"
        # Optionally verify the response content or headers if specified
        # For example, if response returns a message or errorId echo
        if response.content:
            json_response = response.json()
            assert "errorId" not in json_response or json_response.get("errorId") == error_payload["errorId"]
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"POST /log-error failed: {e}")

test_post_log_error_with_valid_payload()