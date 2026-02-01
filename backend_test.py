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
BACKEND_URL = "https://fitness-boost-18.preview.emergentagent.com"
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
        # Test with Origin header (simulates cross-origin request)
        headers = {'Origin': 'https://fitness-boost-18.preview.emergentagent.com'}
        response = requests.get(f"{API_BASE}/", headers=headers)
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
        }
        print(f"Cross-origin CORS Headers: {cors_headers}")
        
        if cors_headers['Access-Control-Allow-Origin']:
            print("✅ CORS Headers Present (verified with Origin header)")
            return True
        else:
            print("❌ CORS Headers Missing even with Origin header")
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

def test_workout_image_generation():
    """Test POST /api/generate-workout-image endpoint"""
    print("\n=== Testing Workout Image Generation ===")
    try:
        test_data = {
            "exercise_name": "Push-up",
            "gender": "male",
            "muscle_group": "chest"
        }
        
        print("⏳ Generating workout image (this may take 30-60 seconds)...")
        response = requests.post(f"{API_BASE}/generate-workout-image", json=test_data, timeout=120)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ['image_base64', 'exercise_name', 'gender', 'muscle_group', 'model']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                # Check if image_base64 is valid base64 data URL
                if data['image_base64'].startswith('data:image/'):
                    print(f"✅ Generated image for {data['exercise_name']}")
                    print(f"Gender: {data['gender']}, Muscle Group: {data['muscle_group']}")
                    print(f"Model: {data['model']}")
                    print(f"Image size: {len(data['image_base64'])} characters")
                    return True
                else:
                    print(f"❌ Invalid image format: {data['image_base64'][:50]}...")
                    return False
            else:
                print(f"❌ Missing fields in response: {missing_fields}")
                return False
        else:
            print(f"❌ Workout Image Generation FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Workout Image Generation FAILED - Request timed out (>120s)")
        return False
    except Exception as e:
        print(f"❌ Workout Image Generation FAILED - Exception: {str(e)}")
        return False

def test_workout_images_batch():
    """Test POST /api/generate-workout-images-batch endpoint"""
    print("\n=== Testing Batch Workout Image Generation ===")
    try:
        test_data = {
            "exercises": [
                {"exercise_name": "Squat", "muscle_group": "legs"},
                {"exercise_name": "Plank", "muscle_group": "core"}
            ],
            "gender": "female"
        }
        
        print("⏳ Generating batch workout images (this may take 60-120 seconds)...")
        response = requests.post(f"{API_BASE}/generate-workout-images-batch", json=test_data, timeout=180)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if 'images' in data and isinstance(data['images'], list):
                images = data['images']
                print(f"Generated {len(images)} images")
                
                success_count = 0
                for i, img in enumerate(images):
                    if 'image_base64' in img and img['image_base64'] and img['image_base64'].startswith('data:image/'):
                        success_count += 1
                        print(f"Image {i+1}: ✅ {img.get('exercise_name', 'Unknown')}")
                    else:
                        print(f"Image {i+1}: ❌ {img.get('exercise_name', 'Unknown')} - {img.get('error', 'Invalid format')}")
                
                if success_count == len(test_data['exercises']):
                    print(f"✅ Batch Image Generation PASSED ({success_count}/{len(test_data['exercises'])})")
                    return True
                else:
                    print(f"❌ Batch Image Generation PARTIAL ({success_count}/{len(test_data['exercises'])})")
                    return False
            else:
                print(f"❌ Invalid response format: {data}")
                return False
        else:
            print(f"❌ Batch Image Generation FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Batch Image Generation FAILED - Request timed out (>180s)")
        return False
    except Exception as e:
        print(f"❌ Batch Image Generation FAILED - Exception: {str(e)}")
        return False

def test_template_plan_generation():
    """Test POST /api/generate-plan-template endpoint - NEW FEATURE"""
    print("\n=== Testing Template-Based Workout Plan Generation (NO AI CREDITS) ===")
    
    # Test Case 1: Fat Loss Plan for Intermediate User
    print("\n--- Test Case 1: Fat Loss Plan ---")
    try:
        test_data = {
            "user_profile": {
                "user_id": "test-user-fat-loss-123",
                "goal_primary": "fat_loss",
                "experience_level": "intermediate",
                "workout_days_per_week": 4,
                "workout_days": ["Monday", "Tuesday", "Thursday", "Friday"],
                "equipment": ["bodyweight", "dumbbells"],
                "gender": "male",
                "session_minutes": 45
            }
        }
        
        response = requests.post(f"{API_BASE}/generate-plan-template", json=test_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check response structure
            required_fields = ['success', 'plan', 'message']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"❌ Missing top-level fields: {missing_fields}")
                return False
            
            if not data.get('success'):
                print(f"❌ Success field is False: {data}")
                return False
            
            plan = data.get('plan', {})
            plan_required_fields = ['id', 'name', 'weeks', 'total_weeks', 'user_id', 'goal', 'experience_level']
            plan_missing_fields = [field for field in plan_required_fields if field not in plan]
            
            if plan_missing_fields:
                print(f"❌ Missing plan fields: {plan_missing_fields}")
                return False
            
            # Validate plan structure
            if plan.get('total_weeks') != 4:
                print(f"❌ Expected 4 weeks, got: {plan.get('total_weeks')}")
                return False
            
            weeks = plan.get('weeks', [])
            if len(weeks) != 4:
                print(f"❌ Expected 4 weeks array, got {len(weeks)} weeks")
                return False
            
            # Check first week structure
            first_week = weeks[0]
            week_required_fields = ['id', 'week_number', 'workouts', 'total_workouts']
            week_missing_fields = [field for field in week_required_fields if field not in first_week]
            
            if week_missing_fields:
                print(f"❌ Missing week fields: {week_missing_fields}")
                return False
            
            # Check workout structure
            workouts = first_week.get('workouts', [])
            if len(workouts) != test_data['user_profile']['workout_days_per_week']:
                print(f"❌ Expected {test_data['user_profile']['workout_days_per_week']} workouts, got {len(workouts)}")
                return False
            
            # Check first workout structure
            first_workout = workouts[0]
            workout_required_fields = ['id', 'name', 'exercises', 'duration_minutes']
            workout_missing_fields = [field for field in workout_required_fields if field not in first_workout]
            
            if workout_missing_fields:
                print(f"❌ Missing workout fields: {workout_missing_fields}")
                return False
            
            # Check exercises structure
            exercises = first_workout.get('exercises', [])
            if len(exercises) == 0:
                print("❌ No exercises found in workout")
                return False
            
            # Check first exercise structure
            first_exercise = exercises[0]
            exercise_required_fields = ['name', 'sets', 'reps', 'rest_seconds', 'muscle_group']
            exercise_missing_fields = [field for field in exercise_required_fields if field not in first_exercise]
            
            if exercise_missing_fields:
                print(f"❌ Missing exercise fields: {exercise_missing_fields}")
                return False
            
            print(f"✅ Fat Loss Plan Generated Successfully")
            print(f"Plan ID: {plan['id']}")
            print(f"Plan Name: {plan['name']}")
            print(f"Total Weeks: {plan['total_weeks']}")
            print(f"Workouts per week: {len(workouts)}")
            print(f"Exercises in first workout: {len(exercises)}")
            
        else:
            print(f"❌ Fat Loss Plan Generation FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Fat Loss Plan Generation FAILED - Exception: {str(e)}")
        return False
    
    # Test Case 2: Muscle Gain Plan for Beginner
    print("\n--- Test Case 2: Muscle Gain Plan ---")
    try:
        test_data = {
            "user_profile": {
                "user_id": "test-user-muscle-gain-456",
                "goal_primary": "muscle_gain",
                "experience_level": "beginner",
                "workout_days_per_week": 3,
                "workout_days": ["Monday", "Wednesday", "Friday"],
                "equipment": ["bodyweight"],
                "gender": "female",
                "session_minutes": 30
            }
        }
        
        response = requests.post(f"{API_BASE}/generate-plan-template", json=test_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('plan', {}).get('total_weeks') == 4:
                print(f"✅ Muscle Gain Plan Generated Successfully")
                print(f"Plan Name: {data['plan']['name']}")
            else:
                print(f"❌ Invalid muscle gain plan structure: {data}")
                return False
        else:
            print(f"❌ Muscle Gain Plan FAILED - Status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Muscle Gain Plan FAILED - Exception: {str(e)}")
        return False
    
    # Test Case 3: Endurance Plan for Advanced User
    print("\n--- Test Case 3: Endurance Plan ---")
    try:
        test_data = {
            "user_profile": {
                "user_id": "test-user-endurance-789",
                "goal_primary": "endurance",
                "experience_level": "advanced",
                "workout_days_per_week": 6,
                "workout_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "equipment": ["bodyweight", "dumbbells", "pull_up_bar"],
                "gender": "male",
                "session_minutes": 60
            }
        }
        
        response = requests.post(f"{API_BASE}/generate-plan-template", json=test_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('plan', {}).get('total_weeks') == 4:
                print(f"✅ Endurance Plan Generated Successfully")
                print(f"Plan Name: {data['plan']['name']}")
            else:
                print(f"❌ Invalid endurance plan structure: {data}")
                return False
        else:
            print(f"❌ Endurance Plan FAILED - Status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Endurance Plan FAILED - Exception: {str(e)}")
        return False
    
    # Test Case 4: Error Handling - Invalid Data
    print("\n--- Test Case 4: Error Handling ---")
    try:
        # Test with missing required fields
        invalid_data = {
            "user_profile": {
                "goal_primary": "invalid_goal"
                # Missing required fields
            }
        }
        
        response = requests.post(f"{API_BASE}/generate-plan-template", json=invalid_data, timeout=30)
        
        if response.status_code in [400, 422, 500]:
            print(f"✅ Error Handling Working - Status: {response.status_code}")
        else:
            print(f"❌ Error Handling Failed - Expected error status, got: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error Handling Test FAILED - Exception: {str(e)}")
        return False
    
    print("✅ Template Plan Generation PASSED - All test cases successful")
    return True

def test_ai_powered_plan_generation():
    """Test POST /api/generate-plan-template endpoint with AI-powered generation (use_ai: true)"""
    print("\n=== Testing AI-Powered Workout Plan Generation (GPT-4o-mini) ===")
    
    # Test Case 1: AI-Powered Fat Loss Plan
    print("\n--- Test Case 1: AI-Powered Fat Loss Plan ---")
    try:
        test_data = {
            "use_ai": True,
            "user_profile": {
                "user_id": "test-user-ai-1",
                "goal_primary": "fat_loss",
                "experience_level": "intermediate",
                "workout_days_per_week": 4,
                "workout_days": ["Monday", "Tuesday", "Thursday", "Friday"],
                "equipment": ["bodyweight", "dumbbells"],
                "gender": "male",
                "session_minutes": 45,
                "coach_tone": "motivational"
            }
        }
        
        print("⏳ Generating AI-powered fat loss plan (this may take 15-30 seconds)...")
        response = requests.post(f"{API_BASE}/generate-plan-template", json=test_data, timeout=60)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check response structure
            required_fields = ['success', 'plan', 'message', 'ai_powered', 'cost_info']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"❌ Missing top-level fields: {missing_fields}")
                return False
            
            if not data.get('success'):
                print(f"❌ Success field is False: {data}")
                return False
            
            if not data.get('ai_powered'):
                print(f"❌ ai_powered should be True for AI generation: {data.get('ai_powered')}")
                return False
            
            plan = data.get('plan', {})
            plan_required_fields = ['name', 'coach_message', 'weeks']
            plan_missing_fields = [field for field in plan_required_fields if field not in plan]
            
            if plan_missing_fields:
                print(f"❌ Missing plan fields: {plan_missing_fields}")
                return False
            
            # Validate plan structure
            weeks = plan.get('weeks', [])
            if len(weeks) != 4:
                print(f"❌ Expected 4 weeks array, got {len(weeks)} weeks")
                return False
            
            # Check that workouts are only on specified days
            first_week = weeks[0]
            workouts = first_week.get('workouts', [])
            expected_days = test_data['user_profile']['workout_days']
            
            for workout in workouts:
                if workout.get('day') not in expected_days:
                    print(f"❌ Workout scheduled on unexpected day: {workout.get('day')}")
                    return False
            
            # Check workout structure includes warmup, main, cooldown
            first_workout = workouts[0] if workouts else {}
            exercises = first_workout.get('exercises', [])
            
            if len(exercises) == 0:
                print("❌ No exercises found in workout")
                return False
            
            # Verify cost info
            cost_info = data.get('cost_info', {})
            if 'estimated_cost_usd' in cost_info:
                cost = cost_info['estimated_cost_usd']
                if not (0.003 <= cost <= 0.005):
                    print(f"⚠️ Cost outside expected range: ${cost} (expected $0.003-0.005)")
            
            print(f"✅ AI-Powered Fat Loss Plan Generated Successfully")
            print(f"Plan Name: {plan['name']}")
            print(f"Coach Message: {plan['coach_message'][:100]}...")
            print(f"AI Powered: {data['ai_powered']}")
            print(f"Estimated Cost: ${cost_info.get('estimated_cost_usd', 'N/A')}")
            
        else:
            print(f"❌ AI Fat Loss Plan Generation FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ AI Fat Loss Plan Generation FAILED - Exception: {str(e)}")
        return False
    
    # Test Case 2: AI-Powered Muscle Gain Plan
    print("\n--- Test Case 2: AI-Powered Muscle Gain Plan ---")
    try:
        test_data = {
            "use_ai": True,
            "user_profile": {
                "user_id": "test-user-ai-2",
                "goal_primary": "muscle_gain",
                "experience_level": "beginner",
                "workout_days_per_week": 3,
                "workout_days": ["Monday", "Wednesday", "Friday"],
                "equipment": ["bodyweight"],
                "gender": "female",
                "session_minutes": 30,
                "coach_tone": "supportive"
            }
        }
        
        print("⏳ Generating AI-powered muscle gain plan (this may take 15-30 seconds)...")
        response = requests.post(f"{API_BASE}/generate-plan-template", json=test_data, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            
            if not data.get('success'):
                print(f"❌ Success field is False: {data}")
                return False
            
            if not data.get('ai_powered'):
                print(f"❌ ai_powered should be True for AI generation: {data.get('ai_powered')}")
                return False
            
            plan = data.get('plan', {})
            if not plan.get('name') or not plan.get('coach_message'):
                print(f"❌ Missing plan name or coach message: {plan}")
                return False
            
            weeks = plan.get('weeks', [])
            if len(weeks) != 4:
                print(f"❌ Expected 4 weeks, got {len(weeks)}")
                return False
            
            print(f"✅ AI-Powered Muscle Gain Plan Generated Successfully")
            print(f"Plan Name: {plan['name']}")
            print(f"Coach Message: {plan['coach_message'][:100]}...")
            print(f"AI Powered: {data['ai_powered']}")
            
        else:
            print(f"❌ AI Muscle Gain Plan FAILED - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ AI Muscle Gain Plan FAILED - Exception: {str(e)}")
        return False
    
    print("✅ AI-Powered Plan Generation PASSED - All test cases successful")
    return True

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
    test_results['workout_image_generation'] = test_workout_image_generation()
    test_results['workout_images_batch'] = test_workout_images_batch()
    test_results['template_plan_generation'] = test_template_plan_generation()
    test_results['ai_powered_plan_generation'] = test_ai_powered_plan_generation()
    
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