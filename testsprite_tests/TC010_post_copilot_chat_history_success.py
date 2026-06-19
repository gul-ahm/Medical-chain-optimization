import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 120  # Ollama execution on local CPU can be slow

def test_post_copilot_chat_history_success():
    url = f"{BASE_URL}/api/v1/ai/copilot/chat"
    headers = {
        "Content-Type": "application/json"
    }
    
    # Step 1: Send the initial question
    payload1 = {
        "query": "Which warehouses are at highest risk of stockouts for insulin in the next 14 days?",
        "warehouse_id": "WH-REG-001"
    }
    
    print("Sending first copilot query...")
    try:
        response1 = requests.post(url, json=payload1, headers=headers, timeout=TIMEOUT)
        response1.raise_for_status()
        assert response1.status_code == 200, f"Expected status code 200, got {response1.status_code}"
        json_data1 = response1.json()
        assert isinstance(json_data1, dict), "Response 1 is not a JSON object"
        
        data_content1 = json_data1.get("data", json_data1)
        assert "response" in data_content1 or "message" in data_content1, \
            f"Response 1 JSON does not contain expected AI response key: {json_data1}"
        
        resp_text1 = data_content1.get("response", data_content1.get("message", ""))
        assert len(resp_text1) > 0, "Response 1 content is empty"
        print("First query succeeded!")
        
    except requests.exceptions.RequestException as e:
        assert False, f"HTTP request 1 failed: {e}"

    # Step 2: Send the follow-up question under the same warehouse context to check history continuation
    payload2 = {
        "query": "Why are those specific warehouses at risk?",
        "warehouse_id": "WH-REG-001"
    }
    
    print("Sending second (continuation) copilot query...")
    try:
        response2 = requests.post(url, json=payload2, headers=headers, timeout=TIMEOUT)
        response2.raise_for_status()
        assert response2.status_code == 200, f"Expected status code 200, got {response2.status_code}"
        json_data2 = response2.json()
        assert isinstance(json_data2, dict), "Response 2 is not a JSON object"
        
        data_content2 = json_data2.get("data", json_data2)
        assert "response" in data_content2 or "message" in data_content2, \
            f"Response 2 JSON does not contain expected AI response key: {json_data2}"
        
        resp_text2 = data_content2.get("response", data_content2.get("message", ""))
        assert len(resp_text2) > 0, "Response 2 content is empty"
        print("Second query succeeded!")
        print("Test passed successfully!")
        
    except requests.exceptions.RequestException as e:
        assert False, f"HTTP request 2 failed: {e}"

if __name__ == "__main__":
    test_post_copilot_chat_history_success()
