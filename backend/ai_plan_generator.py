"""
AI-Powered Workout Plan Generator using OpenAI GPT-4o-mini

Generates truly personalized workout plans based on user profile.
Uses YOUR OpenAI API key - costs ~$0.002 per plan generation.
"""

import os
import json
import uuid
import re
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client with your API key
client = AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

# System prompt for workout plan generation
SYSTEM_PROMPT = """You are an expert personal trainer creating personalized workout plans.

CRITICAL: Return ONLY valid JSON. No markdown, no explanations.

Create a 4-week workout plan matching the user's profile. Each workout includes:
- 3 warmup exercises (is_warmup: true)
- 5-6 main exercises
- 3 cooldown stretches (is_cooldown: true)

Match difficulty to experience level. Only use available equipment.

GOAL GUIDELINES:
- fat_loss: 12-15 reps, 30-45s rest, include cardio
- muscle_gain: 8-12 reps, 60-90s rest, compound movements
- endurance: 15-20 reps, 20-30s rest, circuits
- maintenance: 10-12 reps, 45-60s rest, balanced"""


def get_plan_generation_prompt(user_profile: Dict[str, Any]) -> str:
    """Generate the user prompt for plan creation"""
    
    equipment_list = user_profile.get('equipment', ['bodyweight'])
    if not equipment_list:
        equipment_list = ['bodyweight']
    
    workout_days = user_profile.get('workout_days', ['Monday', 'Wednesday', 'Thursday', 'Friday'])
    
    return f"""Create workout plan JSON for:
- Goal: {user_profile.get('goal_primary', 'maintenance')}
- Experience: {user_profile.get('experience_level', 'intermediate')}
- Gender: {user_profile.get('gender', 'Not specified')}
- Workout Days: {', '.join(workout_days)}
- Equipment: {', '.join(equipment_list)}
- Session Length: {user_profile.get('session_minutes', 45)} min
- Coaching Style: {user_profile.get('coach_tone', 'balanced')}

Return this exact JSON structure:
{{
  "plan_name": "4-Week [Goal] Plan",
  "coach_message": "2 sentence personalized motivation",
  "weeks": [
    {{
      "week_number": 1,
      "theme": "Week theme",
      "workouts": [
        {{
          "day_name": "{workout_days[0] if workout_days else 'Monday'}",
          "workout_name": "Workout Name",
          "duration_minutes": 45,
          "focus_areas": ["muscle1", "muscle2"],
          "exercises": [
            {{"name": "Exercise", "sets": 3, "reps": "10-12", "rest_seconds": 60, "muscle_group": "chest", "is_warmup": false, "is_cooldown": false}}
          ]
        }}
      ]
    }}
  ]
}}

Generate ALL 4 weeks with workouts ONLY on: {', '.join(workout_days)}"""


def fix_json_string(json_str: str) -> str:
    """Attempt to fix common JSON issues"""
    # Remove any markdown code blocks
    json_str = re.sub(r'^```json\s*', '', json_str)
    json_str = re.sub(r'^```\s*', '', json_str)
    json_str = re.sub(r'\s*```$', '', json_str)
    
    # Remove trailing commas before } or ]
    json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
    
    return json_str.strip()


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
            max_tokens=8000,
        )
        
        # Parse the response
        raw_content = response.choices[0].message.content
        fixed_content = fix_json_string(raw_content)
        
        try:
            plan_data = json.loads(fixed_content)
        except json.JSONDecodeError as e:
            # Log the error and raw response for debugging
            print(f"JSON Parse Error: {e}")
            print(f"Raw content length: {len(raw_content)}")
            raise Exception(f"Failed to parse AI response: {str(e)}")
        
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
        
        # Ensure we have 4 weeks (fill in if AI didn't generate all)
        while len(transformed_plan["weeks"]) < 4:
            week_number = len(transformed_plan["weeks"]) + 1
            week_start = start_date + timedelta(weeks=week_number - 1)
            week_end = week_start + timedelta(days=6)
            
            # Copy workouts from week 1 if available
            base_workouts = transformed_plan["weeks"][0]["workouts"] if transformed_plan["weeks"] else []
            
            week_obj = {
                "id": str(uuid.uuid4()),
                "week_number": week_number,
                "theme": f"Week {week_number}",
                "coach_note": "",
                "start_date": week_start.strftime("%Y-%m-%d"),
                "end_date": week_end.strftime("%Y-%m-%d"),
                "workouts": [
                    {**w, "id": str(uuid.uuid4())} for w in base_workouts
                ],
                "total_workouts": len(base_workouts)
            }
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
            print(f"AI plan generation attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                continue
    
    raise last_error
