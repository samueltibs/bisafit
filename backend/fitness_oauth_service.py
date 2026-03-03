"""
Fitbit and Strava OAuth Service
Handles OAuth 2.0 authentication and data fetching for fitness platforms.
"""

import os
import base64
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dotenv import load_dotenv
import httpx

load_dotenv()

logger = logging.getLogger(__name__)

# Fitbit Configuration
FITBIT_CLIENT_ID = os.environ.get("FITBIT_CLIENT_ID", "")
FITBIT_CLIENT_SECRET = os.environ.get("FITBIT_CLIENT_SECRET", "")
FITBIT_REDIRECT_URI = os.environ.get("FITBIT_REDIRECT_URI", "")

# Strava Configuration
STRAVA_CLIENT_ID = os.environ.get("STRAVA_CLIENT_ID", "")
STRAVA_CLIENT_SECRET = os.environ.get("STRAVA_CLIENT_SECRET", "")
STRAVA_REDIRECT_URI = os.environ.get("STRAVA_REDIRECT_URI", "")


# ============================================
# FITBIT OAUTH SERVICE
# ============================================

class FitbitService:
    """Fitbit OAuth and API service"""
    
    AUTH_URL = "https://www.fitbit.com/oauth2/authorize"
    TOKEN_URL = "https://api.fitbit.com/oauth2/token"
    API_BASE = "https://api.fitbit.com/1/user/-"
    
    @staticmethod
    def get_authorization_url(state: str, code_challenge: str) -> str:
        """Generate Fitbit OAuth authorization URL"""
        params = {
            "client_id": FITBIT_CLIENT_ID,
            "redirect_uri": FITBIT_REDIRECT_URI,
            "response_type": "code",
            "scope": "activity heartrate profile settings sleep weight",
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256"
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{FitbitService.AUTH_URL}?{query}"
    
    @staticmethod
    async def exchange_code(code: str, code_verifier: str) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens"""
        credentials = f"{FITBIT_CLIENT_ID}:{FITBIT_CLIENT_SECRET}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                FitbitService.TOKEN_URL,
                headers={
                    "Authorization": f"Basic {encoded_credentials}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data={
                    "client_id": FITBIT_CLIENT_ID,
                    "grant_type": "authorization_code",
                    "redirect_uri": FITBIT_REDIRECT_URI,
                    "code": code,
                    "code_verifier": code_verifier
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Fitbit token exchange failed: {response.text}")
                raise Exception(f"Fitbit token exchange failed: {response.status_code}")
            
            return response.json()
    
    @staticmethod
    async def refresh_token(refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        credentials = f"{FITBIT_CLIENT_ID}:{FITBIT_CLIENT_SECRET}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                FitbitService.TOKEN_URL,
                headers={
                    "Authorization": f"Basic {encoded_credentials}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Fitbit token refresh failed: {response.text}")
                raise Exception(f"Fitbit token refresh failed: {response.status_code}")
            
            return response.json()
    
    @staticmethod
    async def get_profile(access_token: str) -> Dict[str, Any]:
        """Get user profile"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{FitbitService.API_BASE}/profile.json",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            return response.json()
    
    @staticmethod
    async def get_daily_activity(access_token: str, date: str = "today") -> Dict[str, Any]:
        """Get daily activity summary"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{FitbitService.API_BASE}/activities/date/{date}.json",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            return response.json()
    
    @staticmethod
    async def get_activity_logs(access_token: str, before_date: str = None, limit: int = 20) -> Dict[str, Any]:
        """Get activity logs (workouts)"""
        params = {"limit": limit, "sort": "desc", "offset": 0}
        if before_date:
            params["beforeDate"] = before_date
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{FitbitService.API_BASE}/activities/list.json",
                headers={"Authorization": f"Bearer {access_token}"},
                params=params
            )
            return response.json()
    
    @staticmethod
    async def get_heart_rate(access_token: str, date: str = "today") -> Dict[str, Any]:
        """Get heart rate data"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{FitbitService.API_BASE}/activities/heart/date/{date}/1d.json",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            return response.json()
    
    @staticmethod
    async def get_steps(access_token: str, date: str = "today") -> Dict[str, Any]:
        """Get steps data"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{FitbitService.API_BASE}/activities/steps/date/{date}/1d.json",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            return response.json()


# ============================================
# STRAVA OAUTH SERVICE
# ============================================

class StravaService:
    """Strava OAuth and API service"""
    
    AUTH_URL = "https://www.strava.com/oauth/authorize"
    TOKEN_URL = "https://www.strava.com/oauth/token"
    API_BASE = "https://www.strava.com/api/v3"
    
    @staticmethod
    def get_authorization_url(state: str) -> str:
        """Generate Strava OAuth authorization URL"""
        params = {
            "client_id": STRAVA_CLIENT_ID,
            "redirect_uri": STRAVA_REDIRECT_URI,
            "response_type": "code",
            "scope": "activity:read_all,read",
            "approval_prompt": "auto",
            "state": state
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{StravaService.AUTH_URL}?{query}"
    
    @staticmethod
    async def exchange_code(code: str) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                StravaService.TOKEN_URL,
                data={
                    "client_id": STRAVA_CLIENT_ID,
                    "client_secret": STRAVA_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Strava token exchange failed: {response.text}")
                raise Exception(f"Strava token exchange failed: {response.status_code}")
            
            return response.json()
    
    @staticmethod
    async def refresh_token(refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                StravaService.TOKEN_URL,
                data={
                    "client_id": STRAVA_CLIENT_ID,
                    "client_secret": STRAVA_CLIENT_SECRET,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Strava token refresh failed: {response.text}")
                raise Exception(f"Strava token refresh failed: {response.status_code}")
            
            return response.json()
    
    @staticmethod
    async def get_athlete(access_token: str) -> Dict[str, Any]:
        """Get authenticated athlete profile"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{StravaService.API_BASE}/athlete",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            return response.json()
    
    @staticmethod
    async def get_activities(access_token: str, page: int = 1, per_page: int = 30) -> List[Dict[str, Any]]:
        """Get athlete's activities"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{StravaService.API_BASE}/athlete/activities",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"page": page, "per_page": per_page}
            )
            return response.json()
    
    @staticmethod
    async def get_activity(access_token: str, activity_id: int) -> Dict[str, Any]:
        """Get a specific activity with details"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{StravaService.API_BASE}/activities/{activity_id}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            return response.json()
    
    @staticmethod
    async def get_activity_streams(access_token: str, activity_id: int, keys: List[str] = None) -> Dict[str, Any]:
        """Get activity streams (detailed data like heart rate, cadence)"""
        if keys is None:
            keys = ["heartrate", "cadence", "watts", "time", "distance"]
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{StravaService.API_BASE}/activities/{activity_id}/streams",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"keys": ",".join(keys), "key_by_type": "true"}
            )
            return response.json()


# ============================================
# HELPER FUNCTIONS
# ============================================

def normalize_fitbit_activity(activity: Dict) -> Dict[str, Any]:
    """Normalize Fitbit activity to common format"""
    return {
        "id": str(activity.get("logId", "")),
        "source": "fitbit",
        "type": activity.get("activityName", "Unknown").lower(),
        "name": activity.get("activityName", "Workout"),
        "start_time": activity.get("startTime"),
        "duration_minutes": activity.get("duration", 0) / 60000,  # Convert from ms
        "calories": activity.get("calories", 0),
        "distance_meters": activity.get("distance", 0) * 1000 if activity.get("distance") else None,
        "avg_heart_rate": activity.get("averageHeartRate"),
        "steps": activity.get("steps"),
    }


def normalize_strava_activity(activity: Dict) -> Dict[str, Any]:
    """Normalize Strava activity to common format"""
    return {
        "id": str(activity.get("id", "")),
        "source": "strava",
        "type": activity.get("type", "Unknown").lower(),
        "name": activity.get("name", "Workout"),
        "start_time": activity.get("start_date_local"),
        "duration_minutes": activity.get("moving_time", 0) / 60,  # Convert from seconds
        "calories": activity.get("calories", 0),
        "distance_meters": activity.get("distance", 0),
        "avg_heart_rate": activity.get("average_heartrate"),
        "elevation_gain": activity.get("total_elevation_gain"),
    }
