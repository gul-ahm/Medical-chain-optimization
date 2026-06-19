import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 120  # Ollama LLM execution on local machine can be slow

def test_post_copilot_chat_success():
    url = f"{BASE_URL}/api/v1/ai/copilot/chat"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "query": "Which warehouses are at highest risk of stockouts for insulin in the next 14 days?",
        "warehouse_id": "WH-REG-001"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        json_data = response.json()
        assert isinstance(json_data, dict), "Response is not a JSON object"
        
        # Accommodate different nesting formats if returned directly or nested under data
        data_content = json_data.get("data", json_data)
        assert "response" in data_content or "message" in data_content, \
            f"Response JSON does not contain expected AI response key: {json_data}"
        
        resp_text = data_content.get("response", data_content.get("message", ""))
        assert len(resp_text) > 0, "Response content is empty"
        print("Test passed successfully!")
    except requests.exceptions.RequestException as e:
        assert False, f"HTTP request failed: {e}"

if __name__ == "__main__":
    test_post_copilot_chat_success()
