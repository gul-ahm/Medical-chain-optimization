import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_governance_policies_list():
    url = f"{BASE_URL}/api/governance/policies"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), f"Expected response to be a list, got {type(data)}"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"
    except ValueError:
        assert False, "Response is not valid JSON"

test_get_governance_policies_list()