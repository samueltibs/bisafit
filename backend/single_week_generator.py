"""
SINGLE WEEK AI Workout Plan Generator

Generates ONE week at a time for:
- Faster generation (~5-10 seconds)
- Lower cost (~$0.0003 per week)
- Better UX - plans start THIS week, not next week
- Auto-generates next week when current week ends
"""

import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

SYSTEM_PROMPT = """You are an expert personal trainer. Create a 1-week workout plan.

CRITICAL: Return ONLY valid JSON. No markdown, no explanations.

Each workout has:
- 2 warmup exercises (is_warmup: true)
- 4-5 main exercises  
- 2 cooldown stretches (is_cooldown: true)

Match difficulty to experience level. Only use available equipment."""


def get_current_week_monday() -> datetime:
    """Get the Monday of the current week"""
    today = datetime.now()
    days_since_monday = today.weekday()  # Monday = 0
    monday = today - timedelta(days=days_since_monday)
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)


def get_week_prompt(user_profile: Dict[str, Any], week_number: int = 1) -> str:
    """Generate prompt for a single week"""
    
    equipment_list = user_profile.get('equipment', ['bodyweight'])
    if not equipment_list:
        equipment_list = ['bodyweight']
    
    workout_days = user_profile.get('workout_days', ['Monday', 'Wednesday', 'Friday'])
    
    # Week themes for progression
    week_themes = {
        1: "Foundation",
        2: "Building Momentum", 
        3: "Intensity Increase",
        4: "Peak Performance",
        5: "Active Recovery",
        6: "Strength Focus",
        7: "Endurance Push",
        8: "Power Development"
    }
    theme = week_themes.get(week_number, f"Week {week_number}")
    
    # Create a simpler, more reliable prompt
    return f"""Create Week {week_number} workout plan. Goal: {user_profile.get('goal_primary', 'fitness')}. Level: {user_profile.get('experience_level', 'intermediate')}.

Days: {', '.join(workout_days)}
Equipment: {', '.join(equipment_list)}
Duration: {user_profile.get('session_minutes', 45)} min per workout

Return JSON:
{{"week_theme":"{theme}","coach_tip":"Brief tip","workouts":[{{"day_name":"Monday","workout_name":"Name","duration_minutes":45,"focus_areas":["area1"],"exercises":[{{"name":"Exercise","sets":3,"reps":"10","rest_seconds":60,"muscle_group":"chest","is_warmup":false,"is_cooldown":false}}]}}]}}

Create {len(workout_days)} workouts for: {', '.join(workout_days)}. Each with 6-8 exercises (2 warmup, 4-5 main, 1-2 cooldown)."""


async def generate_single_week(
    user_profile: Dict[str, Any], 
    week_number: int = 1,
    start_date: datetime = None
) -> Dict[str, Any]:
    """
    Generate a single week workout plan.
    
    Args:
        user_profile: User's fitness profile
        week_number: Which week in the program (1-8+)
        start_date: When the week starts (defaults to current week's Monday)
    
    Returns:
        Single week plan with workouts
    """
    
    if start_date is None:
        start_date = get_current_week_monday()
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": get_week_prompt(user_profile, week_number)}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=2000,
        )
        
        raw_content = response.choices[0].message.content
        week_data = json.loads(raw_content)
        
        # Day name to index mapping
        day_name_to_index = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
            "Friday": 4, "Saturday": 5, "Sunday": 6
        }
        
        # Transform workouts with proper dates and IDs
        workouts = []
        for workout_data in week_data.get("workouts", []):
            day_name = workout_data.get("day_name", "Monday")
            day_index = day_name_to_index.get(day_name, 0)
            
            # Calculate scheduled date
            scheduled_date = start_date + timedelta(days=day_index)
            
            workout = {
                "id": str(uuid.uuid4()),
                "day_name": day_name,
                "day_of_week": day_index,
                "scheduled_date": scheduled_date.strftime("%Y-%m-%d"),
                "name": workout_data.get("workout_name", "Workout"),
                "duration_minutes": workout_data.get("duration_minutes", 45),
                "focus_areas": workout_data.get("focus_areas", []),
                "exercises": workout_data.get("exercises", []),
            }
            workouts.append(workout)
        
        # Calculate week end date
        end_date = start_date + timedelta(days=6)
        
        week_plan = {
            "id": str(uuid.uuid4()),
            "week_number": week_number,
            "theme": week_data.get("week_theme", f"Week {week_number}"),
            "coach_tip": week_data.get("coach_tip", ""),
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "workouts": workouts,
            "total_workouts": len(workouts),
            "_meta": {
                "model": "gpt-4o-mini",
                "tokens_used": {
                    "prompt": response.usage.prompt_tokens,
                    "completion": response.usage.completion_tokens,
                    "total": response.usage.total_tokens
                },
                "estimated_cost_usd": round(
                    (response.usage.prompt_tokens * 0.00000015) + 
                    (response.usage.completion_tokens * 0.0000006), 
                    6
                )
            }
        }
        
        return week_plan
        
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise Exception(f"Week generation failed: {str(e)}")


async def generate_single_week_with_fallback(
    user_profile: Dict[str, Any],
    week_number: int = 1,
    start_date: datetime = None
) -> Dict[str, Any]:
    """
    Generate single week with retry and fallback to template.
    """
    
    max_retries = 2
    last_error = None
    
    for attempt in range(max_retries):
        try:
            return await generate_single_week(user_profile, week_number, start_date)
        except Exception as e:
            last_error = e
            print(f"Week generation attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                import asyncio
                await asyncio.sleep(1)
    
    # Fallback to template-based generation
    print(f"AI generation failed, using template fallback")
    return generate_template_week(user_profile, week_number, start_date)


def generate_template_week(
    user_profile: Dict[str, Any],
    week_number: int = 1,
    start_date: datetime = None
) -> Dict[str, Any]:
    """Generate a template-based week when AI fails"""
    
    if start_date is None:
        start_date = get_current_week_monday()
    
    workout_days = user_profile.get('workout_days', ['Monday', 'Wednesday', 'Friday'])
    goal = user_profile.get('goal_primary', 'maintenance')
    session_minutes = user_profile.get('session_minutes', 45)
    
    day_name_to_index = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
        "Friday": 4, "Saturday": 5, "Sunday": 6
    }
    
    # Template exercises by goal
    templates = {
        "fat_loss": [
            {"name": "Jumping Jacks", "sets": 3, "reps": "30 seconds", "rest_seconds": 30, "muscle_group": "cardio", "is_warmup": True},
            {"name": "Bodyweight Squats", "sets": 4, "reps": "15", "rest_seconds": 45, "muscle_group": "legs"},
            {"name": "Push-ups", "sets": 3, "reps": "12", "rest_seconds": 45, "muscle_group": "chest"},
            {"name": "Mountain Climbers", "sets": 3, "reps": "20", "rest_seconds": 45, "muscle_group": "core"},
            {"name": "Lunges", "sets": 3, "reps": "12 each leg", "rest_seconds": 45, "muscle_group": "legs"},
            {"name": "Plank", "sets": 3, "reps": "30 seconds", "rest_seconds": 30, "muscle_group": "core", "is_cooldown": True},
        ],
        "muscle_gain": [
            {"name": "Arm Circles", "sets": 2, "reps": "20", "rest_seconds": 30, "muscle_group": "shoulders", "is_warmup": True},
            {"name": "Dumbbell Press", "sets": 4, "reps": "8-10", "rest_seconds": 90, "muscle_group": "chest"},
            {"name": "Dumbbell Rows", "sets": 4, "reps": "8-10", "rest_seconds": 90, "muscle_group": "back"},
            {"name": "Dumbbell Squats", "sets": 4, "reps": "10-12", "rest_seconds": 90, "muscle_group": "legs"},
            {"name": "Bicep Curls", "sets": 3, "reps": "10-12", "rest_seconds": 60, "muscle_group": "arms"},
            {"name": "Stretching", "sets": 1, "reps": "5 min", "rest_seconds": 0, "muscle_group": "full_body", "is_cooldown": True},
        ]
    }
    
    exercises = templates.get(goal, templates["muscle_gain"])
    
    workouts = []
    for i, day_name in enumerate(workout_days):
        day_index = day_name_to_index.get(day_name, 0)
        scheduled_date = start_date + timedelta(days=day_index)
        
        workout = {
            "id": str(uuid.uuid4()),
            "day_name": day_name,
            "day_of_week": day_index,
            "scheduled_date": scheduled_date.strftime("%Y-%m-%d"),
            "name": f"Workout {i + 1}",
            "duration_minutes": session_minutes,
            "focus_areas": ["full_body"],
            "exercises": exercises,
        }
        workouts.append(workout)
    
    end_date = start_date + timedelta(days=6)
    
    return {
        "id": str(uuid.uuid4()),
        "week_number": week_number,
        "theme": f"Week {week_number}",
        "coach_tip": "Focus on form and consistency!",
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "workouts": workouts,
        "total_workouts": len(workouts),
        "_meta": {
            "model": "template-fallback",
            "estimated_cost_usd": 0.0
        }
    }
