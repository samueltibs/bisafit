from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import asyncio
from datetime import datetime
from workout_image_service import generate_workout_image, generate_workout_images_batch
from exercise_image_cache import get_or_generate_exercise_image, batch_get_or_generate_images, get_cached_image, migrate_base64_to_storage, ensure_storage_bucket_exists
from email_service import send_feedback_notification, send_weekly_analytics_report, send_store_interest_confirmation, send_store_interest_admin_notification
from plan_generator import generate_4_week_plan, generate_weekly_plan
from ai_plan_generator import generate_ai_plan_with_fallback
from ai_plan_generator_fast import generate_ai_plan_with_fallback_fast
from single_week_generator import generate_single_week_with_fallback


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


# In-memory storage for pre-generated images (keyed by plan_id)
pre_generated_images: Dict[str, Dict[str, str]] = {}


class PreGenerateImagesRequest(BaseModel):
    """Request to pre-generate images for a workout plan"""
    plan_id: str
    exercises: List[ExerciseInfo]
    gender: str = "male"


async def background_generate_images(plan_id: str, exercises: List[dict], gender: str):
    """Background task to generate all images for a plan"""
    logger.info(f"Starting background image generation for plan {plan_id}")
    
    if plan_id not in pre_generated_images:
        pre_generated_images[plan_id] = {}
    
    for exercise in exercises:
        exercise_name = exercise.get("exercise_name", "")
        muscle_group = exercise.get("muscle_group", "full body")
        
        # Skip if already generated
        if exercise_name in pre_generated_images[plan_id]:
            continue
        
        try:
            result = await generate_workout_image(
                exercise_name=exercise_name,
                gender=gender,
                muscle_group=muscle_group
            )
            if result.get("image_base64"):
                pre_generated_images[plan_id][exercise_name] = result["image_base64"]
                logger.info(f"Generated image for {exercise_name}")
        except Exception as e:
            logger.error(f"Failed to generate image for {exercise_name}: {e}")
            # Store a placeholder to avoid re-attempting
            pre_generated_images[plan_id][exercise_name] = ""
    
    logger.info(f"Completed image generation for plan {plan_id}")


@api_router.post("/pregenerate-workout-images")
async def pregenerate_workout_images(
    request: PreGenerateImagesRequest, 
    background_tasks: BackgroundTasks
):
    """
    Start background generation of all workout images for a plan.
    Returns immediately - images are generated in background.
    Call /get-pregenerated-images/{plan_id} to check progress.
    """
    try:
        # Initialize storage for this plan
        pre_generated_images[request.plan_id] = {}
        
        # Add background task
        background_tasks.add_task(
            background_generate_images,
            request.plan_id,
            [ex.dict() for ex in request.exercises],
            request.gender
        )
        
        return {
            "status": "started",
            "plan_id": request.plan_id,
            "total_exercises": len(request.exercises),
            "message": "Image generation started in background"
        }
    except Exception as e:
        logger.error(f"Error starting image pregeneration: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/get-pregenerated-images/{plan_id}")
async def get_pregenerated_images(plan_id: str, exercise_name: Optional[str] = None):
    """
    Get pre-generated images for a plan.
    
    If exercise_name is provided, returns just that image.
    Otherwise returns all images with their generation status.
    """
    if plan_id not in pre_generated_images:
        return {"status": "not_found", "images": {}}
    
    images = pre_generated_images[plan_id]
    
    if exercise_name:
        image = images.get(exercise_name)
        return {
            "status": "found" if image else "not_ready",
            "exercise_name": exercise_name,
            "image_base64": image
        }
    
    return {
        "status": "ok",
        "plan_id": plan_id,
        "total_generated": len([k for k, v in images.items() if v]),
        "images": images
    }


# ============================================
# EXERCISE IMAGE CACHE (Smart Caching)
# ============================================

class ExerciseImageRequest(BaseModel):
    """Request for a single exercise image"""
    exercise_name: str
    muscle_group: str = "full body"
    gender: str = "neutral"


class BatchExerciseImageRequest(BaseModel):
    """Request for multiple exercise images"""
    exercises: List[ExerciseImageRequest]
    gender: str = "neutral"


@api_router.post("/exercise-image")
async def get_exercise_image(request: ExerciseImageRequest):
    """
    Get or generate an exercise image with smart caching.
    
    - If cached: Returns instantly (no credits used)
    - If not cached: Generates with AI, saves to cache, returns URL
    
    Subsequent requests for the same exercise are FREE and instant.
    """
    try:
        result = await get_or_generate_exercise_image(
            exercise_name=request.exercise_name,
            muscle_group=request.muscle_group,
            gender=request.gender
        )
        return result
    except Exception as e:
        logger.error(f"Error getting exercise image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/exercise-images-batch")
async def get_exercise_images_batch(request: BatchExerciseImageRequest):
    """
    Get or generate multiple exercise images with smart caching.
    
    Cached images return instantly. Only uncached images use credits.
    Great for pre-loading all images during plan generation.
    """
    try:
        exercises = [{"exercise_name": ex.exercise_name, "muscle_group": ex.muscle_group} 
                     for ex in request.exercises]
        results = await batch_get_or_generate_images(exercises, request.gender)
        
        cached_count = sum(1 for r in results if r.get('cached'))
        generated_count = sum(1 for r in results if r.get('generated'))
        
        return {
            "results": results,
            "summary": {
                "total": len(results),
                "from_cache": cached_count,
                "newly_generated": generated_count,
                "credits_used": generated_count  # Only new generations use credits
            }
        }
    except Exception as e:
        logger.error(f"Error getting batch exercise images: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/exercise-image-cached/{exercise_name}")
async def check_exercise_image_cache(exercise_name: str):
    """
    Check if an exercise image is already cached.
    Quick check without generating anything.
    """
    cached_url = await get_cached_image(exercise_name)
    return {
        "exercise_name": exercise_name,
        "cached": cached_url is not None,
        "image_url": cached_url
    }


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


# ============================================
# STORE INTEREST / WAITLIST
# ============================================

class StoreInterestRequest(BaseModel):
    """Request body for store waitlist signup"""
    email: str
    interests: List[str] = []


@api_router.post("/store-interest-notification")
async def store_interest_notification(request: StoreInterestRequest):
    """
    Send confirmation email when user signs up for store notifications.
    Called from the frontend after interest is saved to Supabase.
    """
    try:
        # Send confirmation email to user
        user_result = await send_store_interest_confirmation(
            to_email=request.email,
            interests=request.interests
        )
        
        # Send notification to admin
        admin_result = await send_store_interest_admin_notification(
            user_email=request.email,
            interests=request.interests
        )
        
        return {
            "status": "success",
            "user_email": user_result,
            "admin_notification": admin_result
        }
    except Exception as e:
        logger.error(f"Error sending store interest notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# WORKOUT PLAN GENERATION
# ============================================

class ActiveRestActivity(BaseModel):
    """Active rest activity configuration"""
    id: str
    day: str
    activityType: str
    distanceMiles: Optional[float] = None
    durationMinutes: Optional[int] = None
    description: Optional[str] = None
    enabled: bool = True


class ActiveRestConfig(BaseModel):
    """Active rest days configuration"""
    enabled: bool = False
    activities: List[ActiveRestActivity] = []


class UserProfileForPlan(BaseModel):
    """User profile data for generating a workout plan"""
    user_id: str
    goal_primary: str = "maintenance"
    goal_secondary: Optional[str] = None
    experience_level: str = "intermediate"
    workout_days_per_week: int = 4
    workout_days: List[str] = ["Monday", "Wednesday", "Thursday", "Friday"]
    equipment: List[str] = ["bodyweight"]
    gender: Optional[str] = None
    session_minutes: int = 45
    constraints: Optional[Dict[str, Any]] = None
    coach_tone: str = "balanced"
    active_rest_config: Optional[ActiveRestConfig] = None


class GeneratePlanRequest(BaseModel):
    """Request body for generating a workout plan"""
    user_profile: UserProfileForPlan
    use_ai: bool = True  # Default to AI-powered generation
    fast_mode: bool = True  # Use fast generation (Week 1 AI + progressive weeks)


@api_router.post("/generate-plan-template")
async def generate_plan_from_template(request: GeneratePlanRequest):
    """
    Generate a 4-week workout plan.
    
    If use_ai=True (default): Uses GPT-4o-mini for truly personalized plans
    - fast_mode=True (default): ~20-30 seconds, generates Week 1 with AI, weeks 2-4 progressively (~$0.001/plan)
    - fast_mode=False: ~3 minutes, generates all 4 weeks with AI (~$0.004/plan)
    If use_ai=False: Uses template-based generation (free, but less personalized)
    """
    try:
        logger.info(f"Generating plan for user: {request.user_profile.user_id} (AI: {request.use_ai}, Fast: {request.fast_mode})")
        
        # Convert request to dict for the generator
        profile_data = {
            "user_id": request.user_profile.user_id,
            "goal_primary": request.user_profile.goal_primary,
            "goal_secondary": request.user_profile.goal_secondary,
            "experience_level": request.user_profile.experience_level,
            "workout_days_per_week": request.user_profile.workout_days_per_week,
            "workout_days": request.user_profile.workout_days,
            "equipment": request.user_profile.equipment,
            "gender": request.user_profile.gender,
            "session_minutes": request.user_profile.session_minutes,
            "constraints": request.user_profile.constraints,
            "coach_tone": request.user_profile.coach_tone,
        }
        
        if request.use_ai:
            # AI-powered generation using GPT-4o-mini
            if request.fast_mode:
                # FAST: Week 1 AI + progressive weeks 2-4 (~20-30 seconds)
                plan_data = await generate_ai_plan_with_fallback_fast(profile_data)
            else:
                # SLOW: All 4 weeks fully generated by AI (~3 minutes)
                plan_data = await generate_ai_plan_with_fallback(profile_data)
            logger.info(f"AI Plan generated successfully: {plan_data['id']}")
            
            return {
                "success": True,
                "plan": plan_data,
                "message": plan_data.get("coach_message", "Your personalized AI workout plan is ready!"),
                "ai_powered": True,
                "cost_info": plan_data.get("_meta", {})
            }
        else:
            # Template-based generation (fallback, free)
            plan_data = generate_4_week_plan(profile_data)
            logger.info(f"Template plan generated successfully: {plan_data['id']}")
            
            return {
                "success": True,
                "plan": plan_data,
                "message": "Your workout plan is ready!",
                "ai_powered": False
            }
        
    except Exception as e:
        logger.error(f"Error generating plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# SINGLE WEEK GENERATION (NEW - FASTER)
# ============================================

class SingleWeekRequest(BaseModel):
    """Request for generating a single week"""
    user_id: str
    goal_primary: str = "maintenance"
    experience_level: str = "intermediate"
    workout_days: List[str] = ["Monday", "Wednesday", "Friday"]
    equipment: List[str] = ["bodyweight"]
    session_minutes: int = 45
    week_number: int = 1
    start_date: Optional[str] = None  # YYYY-MM-DD, defaults to current week


@api_router.post("/generate-week")
async def generate_single_week_endpoint(request: SingleWeekRequest):
    """
    Generate a SINGLE week workout plan.
    
    Much faster than full plan generation (~5-10 seconds vs 20-30 seconds).
    Costs ~$0.0003 per week (0.03 cents).
    
    Use this for:
    - Initial plan creation (just Week 1)
    - Auto-generating next week when current week ends
    - Regenerating a specific week
    """
    try:
        logger.info(f"Generating single week for user: {request.user_id}, week {request.week_number}")
        
        profile_data = {
            "user_id": request.user_id,
            "goal_primary": request.goal_primary,
            "experience_level": request.experience_level,
            "workout_days": request.workout_days,
            "equipment": request.equipment,
            "session_minutes": request.session_minutes,
        }
        
        # Parse start_date if provided
        start_date = None
        if request.start_date:
            from datetime import datetime
            start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        
        week_data = await generate_single_week_with_fallback(
            profile_data, 
            week_number=request.week_number,
            start_date=start_date
        )
        
        logger.info(f"Single week generated: {week_data['id']} with {week_data['total_workouts']} workouts")
        
        return {
            "success": True,
            "week": week_data,
            "message": f"Week {request.week_number} is ready!",
            "cost_info": week_data.get("_meta", {})
        }
        
    except Exception as e:
        logger.error(f"Error generating week: {e}")
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
