from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from workout_image_service import generate_workout_image, generate_workout_images_batch
from email_service import send_feedback_notification, send_weekly_analytics_report


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Workout Image Generation Models
class WorkoutImageRequest(BaseModel):
    exercise_name: str
    gender: str = "male"
    muscle_group: str = "full body"

class ExerciseInfo(BaseModel):
    exercise_name: str
    muscle_group: str = "full body"

class WorkoutImagesBatchRequest(BaseModel):
    exercises: List[ExerciseInfo]
    gender: str = "male"

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Workout Image Generation Endpoints
@api_router.post("/generate-workout-image")
async def create_workout_image(request: WorkoutImageRequest):
    """
    Generate an AI-powered workout form guide image.
    Takes 30-60 seconds to generate.
    """
    try:
        result = await generate_workout_image(
            exercise_name=request.exercise_name,
            gender=request.gender,
            muscle_group=request.muscle_group
        )
        return result
    except Exception as e:
        logger.error(f"Error generating workout image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/generate-workout-images-batch")
async def create_workout_images_batch(request: WorkoutImagesBatchRequest):
    """
    Generate multiple workout images in batch.
    Useful for generating all images for a workout plan at once.
    """
    try:
        results = await generate_workout_images_batch(
            exercises=[ex.dict() for ex in request.exercises],
            gender=request.gender
        )
        return {"images": results}
    except Exception as e:
        logger.error(f"Error generating workout images batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Email Notification Models
class FeedbackNotificationRequest(BaseModel):
    feedback_data: Dict[str, Any]

class AnalyticsReportRequest(BaseModel):
    totalUsers: int = 0
    totalEvents: int = 0
    totalFeedback: int = 0
    avgRating: float = 0.0
    topEvents: List[Dict[str, Any]] = []
    recentFeedback: List[Dict[str, Any]] = []


@api_router.post("/send-feedback-notification")
async def send_feedback_email(request: FeedbackNotificationRequest):
    """
    Send email notification when new beta feedback is submitted.
    Called from the frontend after feedback is saved.
    """
    try:
        result = await send_feedback_notification(request.feedback_data)
        return result
    except Exception as e:
        logger.error(f"Error sending feedback notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/send-weekly-report")
async def send_weekly_report(request: AnalyticsReportRequest):
    """
    Send weekly analytics report email.
    Can be called manually or via a scheduled job.
    """
    try:
        result = await send_weekly_analytics_report(request.dict())
        return result
    except Exception as e:
        logger.error(f"Error sending weekly report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
