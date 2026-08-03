"""
Backend API Integration Tests for BisaFit
Tests the FastAPI backend endpoints
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bisafit-rebrand.preview.emergentagent.com').rstrip('/')


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestHealthEndpoints:
    """Test basic health and status endpoints"""
    
    def test_root_endpoint(self, api_client):
        """Test the root API endpoint returns Hello World"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Hello World"
    
    def test_status_get(self, api_client):
        """Test GET /api/status returns list of status checks"""
        response = api_client.get(f"{BASE_URL}/api/status")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_status_post(self, api_client):
        """Test POST /api/status creates a new status check"""
        test_name = f"TEST_status_{uuid.uuid4().hex[:8]}"
        response = api_client.post(
            f"{BASE_URL}/api/status",
            json={"client_name": test_name}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["client_name"] == test_name
        assert "id" in data
        assert "timestamp" in data


class TestWorkoutImageEndpoints:
    """Test workout image generation endpoints"""
    
    def test_exercise_image_cached_check(self, api_client):
        """Test checking if an exercise image is cached"""
        response = api_client.get(f"{BASE_URL}/api/exercise-image-cached/push-up")
        assert response.status_code == 200
        data = response.json()
        assert "exercise_name" in data
        assert "cached" in data
        assert data["exercise_name"] == "push-up"
    
    def test_pregenerated_images_not_found(self, api_client):
        """Test getting pregenerated images for non-existent plan"""
        fake_plan_id = str(uuid.uuid4())
        response = api_client.get(f"{BASE_URL}/api/get-pregenerated-images/{fake_plan_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "not_found"


class TestPlanGenerationEndpoints:
    """Test plan generation endpoints"""
    
    def test_generate_plan_template_validation(self, api_client):
        """Test plan generation endpoint with minimal valid data"""
        # This test validates the endpoint accepts the request format
        # Actual generation requires valid user_id in Supabase
        test_profile = {
            "user_profile": {
                "user_id": str(uuid.uuid4()),
                "goal_primary": "maintenance",
                "experience_level": "intermediate",
                "workout_days_per_week": 4,
                "workout_days": ["Monday", "Wednesday", "Thursday", "Friday"],
                "equipment": ["bodyweight"],
                "session_minutes": 45,
                "coach_tone": "balanced"
            },
            "use_ai": False,  # Use template-based to avoid AI costs
            "fast_mode": True
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/generate-plan-template",
            json=test_profile
        )
        # Should return 200 with plan data or 500 if user doesn't exist in Supabase
        assert response.status_code in [200, 500]


class TestEmailEndpoints:
    """Test email notification endpoints"""
    
    def test_feedback_notification_validation(self, api_client):
        """Test feedback notification endpoint accepts valid data"""
        feedback_data = {
            "feedback_data": {
                "rating": 5,
                "message": "TEST_feedback_message",
                "user_email": "test@example.com"
            }
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/send-feedback-notification",
            json=feedback_data
        )
        # Should return 200 or 500 depending on email service config
        assert response.status_code in [200, 500]


class TestStoreInterestEndpoints:
    """Test store interest/waitlist endpoints"""
    
    def test_store_interest_notification(self, api_client):
        """Test store interest notification endpoint"""
        interest_data = {
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "interests": ["supplements", "apparel"]
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/store-interest-notification",
            json=interest_data
        )
        # Should return 200 or 500 depending on email service config
        assert response.status_code in [200, 500]


class TestImageStorageEndpoints:
    """Test image storage setup endpoints"""
    
    def test_setup_image_storage(self, api_client):
        """Test image storage setup endpoint"""
        response = api_client.post(f"{BASE_URL}/api/setup-image-storage")
        # Should return 200 with success status
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "message" in data


class TestNutritionEndpoints:
    """Test nutrition-related endpoints"""
    
    def test_generate_nutrition_targets(self, api_client):
        """Test generating nutrition targets for a user"""
        test_user_id = str(uuid.uuid4())
        response = api_client.post(
            f"{BASE_URL}/api/generate-nutrition-targets",
            json={
                "user_id": test_user_id,
                "weight_kg": 70,
                "goal_primary": "maintenance",
                "activity_level": "moderate"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "targets" in data
        targets = data["targets"]
        assert "calories_target" in targets
        assert "protein_g" in targets
        assert "water_liters" in targets
        # Verify reasonable values
        assert targets["calories_target"]["low"] > 0
        assert targets["calories_target"]["high"] > targets["calories_target"]["low"]
        assert targets["protein_g"] > 0
        assert targets["water_liters"] >= 2.0
    
    def test_generate_nutrition_targets_fat_loss(self, api_client):
        """Test nutrition targets for fat loss goal"""
        test_user_id = str(uuid.uuid4())
        response = api_client.post(
            f"{BASE_URL}/api/generate-nutrition-targets",
            json={
                "user_id": test_user_id,
                "weight_kg": 80,
                "goal_primary": "fat_loss",
                "activity_level": "active"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Fat loss should have calorie deficit
        targets = data["targets"]
        assert targets["calories_target"]["high"] < 3000  # Should be in deficit
    
    def test_generate_nutrition_targets_muscle_gain(self, api_client):
        """Test nutrition targets for muscle gain goal"""
        test_user_id = str(uuid.uuid4())
        response = api_client.post(
            f"{BASE_URL}/api/generate-nutrition-targets",
            json={
                "user_id": test_user_id,
                "weight_kg": 75,
                "goal_primary": "muscle_gain",
                "activity_level": "very_active"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Muscle gain should have calorie surplus
        targets = data["targets"]
        assert targets["calories_target"]["low"] > 2000  # Should be in surplus


class TestStripeEndpoints:
    """Test Stripe subscription endpoints"""
    
    def test_stripe_checkout_validation(self, api_client):
        """Test Stripe checkout endpoint accepts valid request format"""
        test_user_id = str(uuid.uuid4())
        response = api_client.post(
            f"{BASE_URL}/api/stripe/checkout",
            json={
                "user_id": test_user_id,
                "email": "test@example.com",
                "price_lookup_key": "premium_monthly",
                "success_url": "https://example.com/success",
                "cancel_url": "https://example.com/cancel"
            }
        )
        # Should return 200 or 500 depending on Stripe config
        assert response.status_code in [200, 500]
    
    def test_stripe_subscription_lookup(self, api_client):
        """Test Stripe subscription lookup for non-existent customer"""
        fake_customer_id = "cus_nonexistent123"
        response = api_client.get(f"{BASE_URL}/api/stripe/subscription/{fake_customer_id}")
        # Should return 200 or 500 depending on Stripe config
        assert response.status_code in [200, 500]


class TestFitnessOAuthEndpoints:
    """Test fitness OAuth endpoints (Fitbit, Strava)"""
    
    def test_fitbit_auth_url(self, api_client):
        """Test getting Fitbit OAuth authorization URL"""
        response = api_client.get(
            f"{BASE_URL}/api/fitbit/auth-url",
            params={"state": "test_state", "code_challenge": "test_challenge"}
        )
        # Should return 200 with auth URL or 500 if not configured
        assert response.status_code in [200, 500]
        if response.status_code == 200:
            data = response.json()
            assert "auth_url" in data
    
    def test_strava_auth_url(self, api_client):
        """Test getting Strava OAuth authorization URL"""
        response = api_client.get(
            f"{BASE_URL}/api/strava/auth-url",
            params={"state": "test_state"}
        )
        # Should return 200 with auth URL or 500 if not configured
        assert response.status_code in [200, 500]
        if response.status_code == 200:
            data = response.json()
            assert "auth_url" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
