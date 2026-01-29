#!/usr/bin/env python3
"""
BisaFit Backend API Testing Suite
Tests all backend endpoints and functionality
"""

import requests
import json
import time
from datetime import datetime
import uuid

# Get backend URL from frontend .env
BACKEND_URL = "https://bisafit-portal.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_api_health_check():
    """Test GET /api/ endpoint - should return Hello World"""
    print("\n=== Testing API Health Check ===")
    try:
        response = requests.get(f"{API_BASE}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                print("✅ API Health Check PASSED")
                return True
            else:
                print(f"❌ API Health Check FAILED - Expected 'Hello World', got: {data}")
                return False
        else:
            print(f"❌ API Health Check FAILED - Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ API Health Check FAILED - Exception: {str(e)}")
        return False

def test_cors_headers():
    """Test CORS configuration"""
    print("\n=== Testing CORS Configuration ===")
    try:
        response = requests.get(f"{API_BASE}/")
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        print(f"CORS Headers: {cors_headers}")
        
        if cors_headers['Access-Control-Allow-Origin']:
            print("✅ CORS Headers Present")
            return True
        else:
            print("❌ CORS Headers Missing")
            return False
            
    except Exception as e:
        print(f"❌ CORS Test FAILED - Exception: {str(e)}")
        return False

def test_mongodb_create_status():
    """Test POST /api/status with sample data"""
    print("\n=== Testing MongoDB Create Status ===")
    try:
        test_data = {
            "client_name": "fitness_app_user"
        }
        
        response = requests.post(f"{API_BASE}/status", json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            # Check if response has required fields
            required_fields = ['id', 'client_name', 'timestamp']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                # Validate UUID format
                try:
                    uuid.UUID(data['id'])
                    print("✅ UUID format is valid")
                except ValueError:
                    print(f"❌ Invalid UUID format: {data['id']}")
                    return False
                
                # Validate timestamp format and check if it's current
                try:
                    timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
                    current_time = datetime.utcnow()
                    time_diff = abs((current_time - timestamp.replace(tzinfo=None)).total_seconds())
                    
                    if time_diff < 60:  # Within 1 minute
                        print(f"✅ Timestamp is current: {data['timestamp']}")
                    else:
                        print(f"❌ Timestamp seems old: {data['timestamp']} (diff: {time_diff}s)")
                        return False
                        
                except Exception as e:
                    print(f"❌ Invalid timestamp format: {data['timestamp']} - {str(e)}")
                    return False
                
                print("✅ MongoDB Create Status PASSED")
                return data  # Return the created object for further testing
            else:
                print(f"❌ MongoDB Create Status FAILED - Missing fields: {missing_fields}")
                return False
        else:
            print(f"❌ MongoDB Create Status FAILED - Status code: {response.status_code}")
            print(f"Response text: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ MongoDB Create Status FAILED - Exception: {str(e)}")
        return False

def test_mongodb_get_status():
    """Test GET /api/status to retrieve all status checks"""
    print("\n=== Testing MongoDB Get Status ===")
    try:
        response = requests.get(f"{API_BASE}/status")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Number of status checks retrieved: {len(data)}")
            
            if isinstance(data, list):
                if len(data) > 0:
                    # Check first item structure
                    first_item = data[0]
                    required_fields = ['id', 'client_name', 'timestamp']
                    missing_fields = [field for field in required_fields if field not in first_item]
                    
                    if not missing_fields:
                        print(f"✅ Retrieved {len(data)} status check(s)")
                        print(f"Sample item: {first_item}")
                        return True
                    else:
                        print(f"❌ Retrieved data missing fields: {missing_fields}")
                        return False
                else:
                    print("✅ Retrieved empty list (no data yet)")
                    return True
            else:
                print(f"❌ Expected list, got: {type(data)}")
                return False
        else:
            print(f"❌ MongoDB Get Status FAILED - Status code: {response.status_code}")
            print(f"Response text: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ MongoDB Get Status FAILED - Exception: {str(e)}")
        return False

def test_data_persistence():
    """Test that data persists between requests"""
    print("\n=== Testing Data Persistence ===")
    
    # Create a unique test entry
    unique_name = f"persistence_test_{int(time.time())}"
    test_data = {"client_name": unique_name}
    
    try:
        # Create the entry
        create_response = requests.post(f"{API_BASE}/status", json=test_data)
        if create_response.status_code != 200:
            print(f"❌ Failed to create test entry: {create_response.status_code}")
            return False
        
        created_item = create_response.json()
        created_id = created_item['id']
        
        # Wait a moment
        time.sleep(1)
        
        # Retrieve all entries and check if our entry exists
        get_response = requests.get(f"{API_BASE}/status")
        if get_response.status_code != 200:
            print(f"❌ Failed to retrieve entries: {get_response.status_code}")
            return False
        
        all_entries = get_response.json()
        found_entry = None
        
        for entry in all_entries:
            if entry.get('id') == created_id:
                found_entry = entry
                break
        
        if found_entry:
            print(f"✅ Data Persistence PASSED - Found entry: {found_entry}")
            return True
        else:
            print(f"❌ Data Persistence FAILED - Entry with ID {created_id} not found")
            return False
            
    except Exception as e:
        print(f"❌ Data Persistence Test FAILED - Exception: {str(e)}")
        return False

def test_error_handling():
    """Test error handling for invalid requests"""
    print("\n=== Testing Error Handling ===")
    
    # Test 1: POST without required field
    try:
        response = requests.post(f"{API_BASE}/status", json={})
        print(f"Empty POST Status Code: {response.status_code}")
        if response.status_code in [400, 422]:  # FastAPI returns 422 for validation errors
            print("✅ Empty POST properly rejected")
        else:
            print(f"❌ Empty POST should return 400/422, got: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Empty POST test failed: {str(e)}")
        return False
    
    # Test 2: Invalid JSON
    try:
        response = requests.post(f"{API_BASE}/status", data="invalid json")
        print(f"Invalid JSON Status Code: {response.status_code}")
        if response.status_code in [400, 422]:
            print("✅ Invalid JSON properly rejected")
        else:
            print(f"❌ Invalid JSON should return 400/422, got: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Invalid JSON test failed: {str(e)}")
        return False
    
    # Test 3: Non-existent endpoint
    try:
        response = requests.get(f"{API_BASE}/nonexistent")
        print(f"Non-existent endpoint Status Code: {response.status_code}")
        if response.status_code == 404:
            print("✅ Non-existent endpoint properly returns 404")
            return True
        else:
            print(f"❌ Non-existent endpoint should return 404, got: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Non-existent endpoint test failed: {str(e)}")
        return False

def test_multiple_requests():
    """Test multiple requests to verify consistency"""
    print("\n=== Testing Multiple Requests ===")
    
    success_count = 0
    total_requests = 5
    
    for i in range(total_requests):
        try:
            test_data = {"client_name": f"multi_test_user_{i}"}
            response = requests.post(f"{API_BASE}/status", json=test_data)
            
            if response.status_code == 200:
                success_count += 1
                print(f"Request {i+1}: ✅")
            else:
                print(f"Request {i+1}: ❌ Status {response.status_code}")
                
        except Exception as e:
            print(f"Request {i+1}: ❌ Exception: {str(e)}")
    
    if success_count == total_requests:
        print(f"✅ Multiple Requests PASSED ({success_count}/{total_requests})")
        return True
    else:
        print(f"❌ Multiple Requests FAILED ({success_count}/{total_requests})")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting BisaFit Backend API Testing Suite")
    print(f"Testing against: {API_BASE}")
    
    test_results = {}
    
    # Run all tests
    test_results['health_check'] = test_api_health_check()
    test_results['cors'] = test_cors_headers()
    test_results['create_status'] = test_mongodb_create_status()
    test_results['get_status'] = test_mongodb_get_status()
    test_results['data_persistence'] = test_data_persistence()
    test_results['error_handling'] = test_error_handling()
    test_results['multiple_requests'] = test_multiple_requests()
    
    # Summary
    print("\n" + "="*50)
    print("📊 TEST SUMMARY")
    print("="*50)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend tests PASSED!")
        return True
    else:
        print("⚠️  Some backend tests FAILED!")
        return False

if __name__ == "__main__":
    run_all_tests()