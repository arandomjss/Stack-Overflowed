import requests
import json

# Test the auth endpoints
BASE_URL = "http://localhost:5000"

print("Testing Backend Auth Endpoints...")
print("=" * 50)

# Test 1: Health check
try:
    response = requests.get(f"{BASE_URL}/health")
    print(f"✓ Health Check: {response.json()}")
except Exception as e:
    print(f"✗ Health Check Failed: {e}")

# Test 2: Register endpoint
try:
    payload = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    print(f"\n✓ Register Endpoint: {response.status_code}")
    print(f"  Response: {response.json()}")
except Exception as e:
    print(f"\n✗ Register Failed: {e}")

# Test 3: Login endpoint
try:
    payload = {
        "username": "testuser",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    print(f"\n✓ Login Endpoint: {response.status_code}")
    print(f"  Response: {response.json()}")
except Exception as e:
    print(f"\n✗ Login Failed: {e}")

print("\n" + "=" * 50)
print("If you see errors above, restart the backend server!")
