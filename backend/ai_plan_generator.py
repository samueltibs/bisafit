"""
AI-Powered Workout Plan Generator using OpenAI GPT-4o-mini

Generates truly personalized workout plans based on user profile.
Uses YOUR OpenAI API key - costs ~$0.002 per plan generation.
"""

import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client with your API key
client = AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

# System prompt for workout plan generation
SYSTEM_PROMPT = """You are an expert personal trainer and fitness coach creating personalized workout plans.

Your task is to generate a detailed 4-week workout plan based on the user's profile.

IMPORTANT RULES:
1. Create EXACTLY 4 weeks of workouts
2. Each workout must include warmup (3-4 exercises), main workout (5-8 exercises), and cooldown (3-4 stretches)
3. Match exercise difficulty to user's experience level
4. Only include exercises that use the user's available equipment
5. Respect any health constraints or injuries
6. Vary workouts throughout the week to target different muscle groups
7. Include progressive overload - slightly increase intensity each week
8. Match the coaching tone to user's preference

EXERCISE GUIDELINES BY GOAL:
- Fat Loss: Higher reps (12-15), shorter rest (30-45s), include cardio bursts
- Muscle Gain: Moderate reps (8-12), longer rest (60-90s), compound movements
- Endurance: High reps (15-20), minimal rest (20-30s), circuit style
- Maintenance: Balanced approach (10-12 reps), moderate rest (45-60s)

EXPERIENCE LEVELS:
- Beginner: Basic movements, bodyweight focus, form emphasis
- Intermediate: Progressive loading, varied exercises, supersets
- Advanced: Complex movements, high volume, advanced techniques

Return a valid JSON object following the exact schema provided."""


def get_plan_generation_prompt(user_profile: Dict[str, Any]) -> str:
    """Generate the user prompt for plan creation"""
    
    equipment_list = user_profile.get('equipment', ['bodyweight'])
    if not equipment_list:
        equipment_list = ['bodyweight']
    
    constraints = user_profile.get('constraints', {})
    injury_flags = constraints.get('injury_flags', []) if isinstance(constraints, dict) else []
    health_notes = constraints.get('notes', '') if isinstance(constraints, dict) else ''
    
    return f"""Create a personalized 4-week workout plan for this user:

**User Profile:**
- Gender: {user_profile.get('gender', 'Not specified')}
- Primary Goal: {user_profile.get('goal_primary', 'maintenance')}
- Secondary Goal: {user_profile.get('goal_secondary', 'None')}
- Experience Level: {user_profile.get('experience_level', 'intermediate')}
- Workout Days Per Week: {user_profile.get('workout_days_per_week', 4)}
- Preferred Workout Days: {', '.join(user_profile.get('workout_days', ['Monday', 'Wednesday', 'Thursday', 'Friday']))}
- Session Duration: {user_profile.get('session_minutes', 45)} minutes
- Available Equipment: {', '.join(equipment_list)}
- Health Constraints/Injuries: {', '.join(injury_flags) if injury_flags else 'None'}
- Additional Health Notes: {health_notes or 'None'}
- Preferred Coaching Tone: {user_profile.get('coach_tone', 'balanced')}

**Required JSON Schema:**
{{
  "plan_name": "string - descriptive name like '4-Week Fat Loss Plan'",
  "coach_message": "string - personalized motivational message for the user (2-3 sentences)",
  "weeks": [
    {{
      "week_number": 1,
      "theme": "string - week focus like 'Foundation Building'",
      "coach_note": "string - brief note about this week's focus",
      "workouts": [
        {{
          "day_name": "Monday",
          "workout_name": "string - descriptive name like 'Upper Body Strength'",
          "duration_minutes": 45,
          "focus_areas": ["chest", "shoulders", "triceps"],
          "exercises": [
            {{
              "name": "string - exercise name",
              "sets": 3,
              "reps": "10-12",
              "rest_seconds": 60,
              "muscle_group": "string",
              "notes": "string - form tips or modifications",
              "is_warmup": false,
              "is_cooldown": false
            }}
          ]
        }}
      ]
    }}
  ]
}}

Generate all 4 weeks with workouts ONLY on the specified workout days. Other days should not have workouts.
Make sure exercise selection matches the available equipment and experience level.
Include warmup exercises (is_warmup: true) and cooldown stretches (is_cooldown: true) for each workout."""


async def generate_ai_plan(user_profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a personalized workout plan using GPT-4o-mini.
    
    Cost: ~$0.002 per plan (0.2 cents)
    """
    
    user_id = user_profile.get('user_id', str(uuid.uuid4()))
    
    try:
        # Call GPT-4o-mini
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": get_plan_generation_prompt(user_profile)}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=4000,
        )
        
        # Parse the response
        plan_data = json.loads(response.choices[0].message.content)
        
        # Calculate dates
        today = datetime.now()
        # Start from next Monday
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        start_date = today + timedelta(days=days_until_monday)
        
        # Transform to the format expected by the frontend
        plan_id = str(uuid.uuid4())
        
        transformed_plan = {
            "id": plan_id,
            "name": plan_data.get("plan_name", "4-Week Personalized Plan"),
            "coach_message": plan_data.get("coach_message", "Let's crush your fitness goals!"),
            "goal": user_profile.get("goal_primary", "maintenance"),
            "experience_level": user_profile.get("experience_level", "intermediate"),
            "total_weeks": 4,
            "created_at": datetime.now().isoformat(),
            "user_id": user_id,
            "weeks": []
        }
        
        # Process each week
        day_name_to_index = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
            "Friday": 4, "Saturday": 5, "Sunday": 6
        }
        
        for week_data in plan_data.get("weeks", []):
            week_number = week_data.get("week_number", 1)
            week_start = start_date + timedelta(weeks=week_number - 1)
            week_end = week_start + timedelta(days=6)
            
            week_obj = {
                "id": str(uuid.uuid4()),
                "week_number": week_number,
                "theme": week_data.get("theme", f"Week {week_number}"),
                "coach_note": week_data.get("coach_note", ""),
                "start_date": week_start.strftime("%Y-%m-%d"),
                "end_date": week_end.strftime("%Y-%m-%d"),
                "workouts": [],
                "total_workouts": 0
            }
            
            for workout_data in week_data.get("workouts", []):
                day_name = workout_data.get("day_name", "Monday")
                day_index = day_name_to_index.get(day_name, 0)
                
                workout_obj = {
                    "id": str(uuid.uuid4()),
                    "name": workout_data.get("workout_name", "Workout"),
                    "day_name": day_name,
                    "day_of_week": day_index,
                    "day_number": week_obj["total_workouts"] + 1,
                    "duration_minutes": workout_data.get("duration_minutes", 45),
                    "focus_areas": workout_data.get("focus_areas", []),
                    "exercises": workout_data.get("exercises", [])
                }
                
                week_obj["workouts"].append(workout_obj)
                week_obj["total_workouts"] += 1
            
            transformed_plan["weeks"].append(week_obj)
        
        # Add token usage info for cost tracking
        usage = response.usage
        transformed_plan["_meta"] = {
            "model": "gpt-4o-mini",
            "tokens_used": {
                "prompt": usage.prompt_tokens,
                "completion": usage.completion_tokens,
                "total": usage.total_tokens
            },
            "estimated_cost_usd": round(
                (usage.prompt_tokens * 0.00000015) + (usage.completion_tokens * 0.0000006), 
                6
            )
        }
        
        return transformed_plan
        
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        raise Exception(f"AI plan generation failed: {str(e)}")


async def generate_ai_plan_with_fallback(user_profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate plan with AI, with automatic retry on failure.
    """
    max_retries = 2
    last_error = None
    
    for attempt in range(max_retries):
        try:
            return await generate_ai_plan(user_profile)
        except Exception as e:
            last_error = e
            if attempt < max_retries - 1:
                continue
    
    raise last_error
