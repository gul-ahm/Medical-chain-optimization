import requests

def test_get_main_dashboard_without_authentication():
    url = "http://localhost:3000/"
    try:
        response = requests.get(url, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request to main dashboard failed: {e}"
    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    # Since this is a Next.js frontend page, the response is likely HTML
    content_type = response.headers.get("Content-Type", "")
    assert "text/html" in content_type, f"Expected HTML content but got {content_type}"
    assert response.text.strip() != "", "Response text is empty, dashboard UI might not have loaded"

test_get_main_dashboard_without_authentication()