#!/usr/bin/env python3
"""
BisaFit Backend API Testing - Review Request Specific Tests
Tests the exact endpoints and data mentioned in the review request
"""

import requests
import json
import time

# Backend URL from review request
BACKEND_URL = "https://bisafit-rebrand.preview.emergentagent.com"  # Production URL
API_BASE = f"{BACKEND_URL}/api"

def test_health_check():
    """Test GET /api/ - Health check (should return {"message": "Hello World"})"""
    print("\n=== Testing Health Check (Review Request) ===")
    try:
        response = requests.get(f"{API_BASE}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                print("✅ Health Check PASSED")
                return True
            else:
                print(f"❌ Health Check FAILED - Expected 'Hello World', got: {data}")
                return False
        else:
            print(f"❌ Health Check FAILED - Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Health Check FAILED - Exception: {str(e)}")
        return False

def test_generate_plan_template_fast():
    """Test POST /api/generate-plan-template - Plan generation (FAST mode)"""
    print("\n=== Testing Plan Generation (FAST mode) ===")
    try:
        test_data = {
            "user_profile": {
                "user_id": "test-user-123",
                "goal_primary": "fat_loss",
                "experience_level": "beginner",
                "workout_days": ["Monday", "Wednesday", "Friday"],
                "equipment": ["bodyweight"],
                "session_minutes": 30
            },
            "use_ai": True,
            "fast_mode": True
        }
        
        print("⏳ Generating plan (may take 20-30 seconds)...")
        response = requests.post(f"{API_BASE}/generate-plan-template", json=test_data, timeout=90)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            if data.get('success'):
                plan = data.get('plan', {})
                print(f"✅ Plan Generation PASSED")
                print(f"Plan ID: {plan.get('id', 'N/A')}")
                print(f"Plan Name: {plan.get('name', 'N/A')}")
                print(f"AI Powered: {data.get('ai_powered', False)}")
                print(f"Weeks: {len(plan.get('weeks', []))}")
                return True
            else:
                print(f"❌ Plan Generation FAILED - Success is False: {data}")
                return False
        else:
            print(f"❌ Plan Generation FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Plan Generation FAILED - Request timed out (>90s)")
        return False
    except Exception as e:
        print(f"❌ Plan Generation FAILED - Exception: {str(e)}")
        return False

def test_store_interest_notification():
    """Test POST /api/store-interest-notification - Store waitlist email"""
    print("\n=== Testing Store Interest Notification ===")
    try:
        test_data = {
            "email": "test@example.com",
            "interests": ["apparel", "equipment"]
        }
        
        print("⏳ Sending store interest notification...")
        response = requests.post(f"{API_BASE}/store-interest-notification", json=test_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            
            if data.get('status') == 'success':
                print("✅ Store Interest Notification PASSED")
                return True
            else:
                print(f"❌ Store Interest Notification FAILED - Status not success: {data}")
                return False
        else:
            print(f"❌ Store Interest Notification FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Store Interest Notification FAILED - Exception: {str(e)}")
        return False

def test_feedback_notification():
    """Test POST /api/send-feedback-notification - Feedback email notification"""
    print("\n=== Testing Feedback Notification ===")
    try:
        test_data = {
            "feedback_data": {
                "overallRating": 4,
                "wouldRecommend": "likely",
                "oneImprovement": "Faster plan generation"
            }
        }
        
        print("⏳ Sending feedback notification...")
        response = requests.post(f"{API_BASE}/send-feedback-notification", json=test_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            print("✅ Feedback Notification PASSED")
            return True
        else:
            print(f"❌ Feedback Notification FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Feedback Notification FAILED - Exception: {str(e)}")
        return False

def run_review_tests():
    """Run all tests mentioned in the review request"""
    print("🚀 Starting BisaFit Backend API Testing - Review Request")
    print(f"Testing against: {API_BASE}")
    
    test_results = {}
    
    # Run specific tests from review request
    test_results['health_check'] = test_health_check()
    test_results['generate_plan_fast'] = test_generate_plan_template_fast()
    test_results['store_interest'] = test_store_interest_notification()
    test_results['feedback_notification'] = test_feedback_notification()
    
    # Summary
    print("\n" + "="*60)
    print("📊 REVIEW REQUEST TEST SUMMARY")
    print("="*60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All review request tests PASSED!")
        return True
    else:
        print("⚠️  Some review request tests FAILED!")
        return False

if __name__ == "__main__":
    run_review_tests()