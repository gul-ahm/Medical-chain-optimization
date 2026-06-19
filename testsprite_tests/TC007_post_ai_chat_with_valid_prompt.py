import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_ai_chat_with_valid_prompt():
    url = f"{BASE_URL}/api/ai/chat"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": "Provide an overview of the current health status of the entire enterprise medical supply intelligence platform."
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        json_data = response.json()
        assert isinstance(json_data, dict), "Response is not a JSON object"
        assert "response" in json_data or "message" in json_data or "result" in json_data, \
            "Response JSON does not contain expected AI-generated response key"
        # Further checks can be added here to validate the content if the schema is known
    except requests.exceptions.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_post_ai_chat_with_valid_prompt()