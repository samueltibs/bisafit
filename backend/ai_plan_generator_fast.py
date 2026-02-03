"""
FAST AI-Powered Workout Plan Generator using OpenAI GPT-4o-mini

Optimized for speed: Generates Week 1 with AI, then programmatically
creates progressive weeks 2-4. Result: ~20-30 seconds vs 3+ minutes.

Uses YOUR OpenAI API key - costs ~$0.001 per plan generation.
"""

import os
import json
import uuid
import re
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client with your API key
client = AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

# Optimized system prompt - generates ONLY week 1
SYSTEM_PROMPT_FAST = """You are an expert personal trainer. Create Week 1 of a workout plan.

CRITICAL: Return ONLY valid JSON. No markdown, no explanations.

Each workout has:
- 2 warmup exercises (is_warmup: true)
- 4-5 main exercises  
- 2 cooldown stretches (is_cooldown: true)

Match difficulty to experience level. Only use available equipment."""


def get_week1_prompt(user_profile: Dict[str, Any]) -> str:
    """Generate prompt for Week 1 only"""
    
    equipment_list = user_profile.get('equipment', ['bodyweight'])
    if not equipment_list:
        equipment_list = ['bodyweight']
    
    workout_days = user_profile.get('workout_days', ['Monday', 'Wednesday', 'Thursday', 'Friday'])
    
    return f"""Create Week 1 workout plan JSON for:
- Goal: {user_profile.get('goal_primary', 'maintenance')}
- Experience: {user_profile.get('experience_level', 'intermediate')}
- Gender: {user_profile.get('gender', 'Not specified')}
- Workout Days: {', '.join(workout_days)}
- Equipment: {', '.join(equipment_list)}
- Session Length: {user_profile.get('session_minutes', 45)} min

Return this JSON:
{{
  "plan_name": "4-Week [Goal] Plan",
  "coach_message": "2 sentence personalized motivation",
  "week": {{
    "theme": "Foundation Week",
    "workouts": [
      {{
        "day_name": "{workout_days[0]}",
        "workout_name": "Name",
        "duration_minutes": {user_profile.get('session_minutes', 45)},
        "focus_areas": ["muscle1", "muscle2"],
        "exercises": [
          {{"name": "Exercise", "sets": 3, "reps": "10-12", "rest_seconds": 60, "muscle_group": "chest", "is_warmup": false, "is_cooldown": false}}
        ]
      }}
    ]
  }}
}}

Generate workouts ONLY for these days: {', '.join(workout_days)}"""


def fix_json_string(json_str: str) -> str:
    """Attempt to fix common JSON issues"""
    json_str = re.sub(r'^```json\s*', '', json_str)
    json_str = re.sub(r'^```\s*', '', json_str)
    json_str = re.sub(r'\s*```$', '', json_str)
    json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
    return json_str.strip()


def create_progressive_weeks(week1_workouts: List[Dict], goal: str, experience: str) -> List[Dict]:
    """
    Create weeks 2-4 based on week 1 with progressive overload.
    Varies sets, reps, and rest times appropriately.
    """
    
    # Progression patterns based on goal
    progression = {
        "fat_loss": {
            2: {"sets_mod": 0, "reps_mod": "+2", "rest_mod": -5},
            3: {"sets_mod": 1, "reps_mod": 0, "rest_mod": -5},
            4: {"sets_mod": 1, "reps_mod": "+2", "rest_mod": -10}
        },
        "muscle_gain": {
            2: {"sets_mod": 0, "reps_mod": "+1", "rest_mod": 0},
            3: {"sets_mod": 1, "reps_mod": 0, "rest_mod": 5},
            4: {"sets_mod": 1, "reps_mod": "+2", "rest_mod": 0}
        },
        "endurance": {
            2: {"sets_mod": 0, "reps_mod": "+3", "rest_mod": -5},
            3: {"sets_mod": 0, "reps_mod": "+5", "rest_mod": -10},
            4: {"sets_mod": 1, "reps_mod": "+5", "rest_mod": -10}
        },
        "maintenance": {
            2: {"sets_mod": 0, "reps_mod": 0, "rest_mod": 0},
            3: {"sets_mod": 0, "reps_mod": "+1", "rest_mod": 0},
            4: {"sets_mod": 0, "reps_mod": "+1", "rest_mod": -5}
        }
    }
    
    week_themes = {
        2: "Building Momentum",
        3: "Intensity Increase", 
        4: "Peak Performance"
    }
    
    pattern = progression.get(goal, progression["maintenance"])
    weeks = []
    
    for week_num in [2, 3, 4]:
        mods = pattern[week_num]
        week_workouts = []
        
        for workout in week1_workouts:
            new_workout = {
                "id": str(uuid.uuid4()),
                "name": workout.get("name", "Workout"),
                "day_name": workout.get("day_name"),
                "day_of_week": workout.get("day_of_week"),
                "day_number": workout.get("day_number"),
                "duration_minutes": workout.get("duration_minutes", 45),
                "focus_areas": workout.get("focus_areas", []),
                "exercises": []
            }
            
            for ex in workout.get("exercises", []):
                new_ex = ex.copy()
                new_ex["id"] = str(uuid.uuid4())
                
                # Apply progression (only to main exercises, not warmup/cooldown)
                if not ex.get("is_warmup") and not ex.get("is_cooldown"):
                    # Modify sets
                    if mods["sets_mod"]:
                        new_ex["sets"] = ex.get("sets", 3) + mods["sets_mod"]
                    
                    # Modify reps (handle string reps like "10-12")
                    reps = ex.get("reps", "10")
                    if isinstance(reps, str) and mods["reps_mod"]:
                        if "-" in reps:
                            low, high = reps.split("-")
                            mod_val = int(mods["reps_mod"].replace("+", "")) if isinstance(mods["reps_mod"], str) else mods["reps_mod"]
                            new_ex["reps"] = f"{int(low)+mod_val}-{int(high)+mod_val}"
                        else:
                            try:
                                mod_val = int(mods["reps_mod"].replace("+", "")) if isinstance(mods["reps_mod"], str) else mods["reps_mod"]
                                new_ex["reps"] = str(int(reps) + mod_val)
                            except:
                                pass
                    
                    # Modify rest
                    if mods["rest_mod"]:
                        new_rest = ex.get("rest_seconds", 60) + mods["rest_mod"]
                        new_ex["rest_seconds"] = max(15, new_rest)  # Minimum 15 seconds rest
                
                new_workout["exercises"].append(new_ex)
            
            week_workouts.append(new_workout)
        
        weeks.append({
            "theme": week_themes[week_num],
            "workouts": week_workouts
        })
    
    return weeks


async def generate_ai_plan_fast(user_profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a personalized workout plan using GPT-4o-mini (FAST version).
    
    Generates Week 1 with AI (~20-30 seconds), then creates progressive weeks 2-4.
    Cost: ~$0.001 per plan (0.1 cents)
    """
    
    user_id = user_profile.get('user_id', str(uuid.uuid4()))
    
    try:
        # Call GPT-4o-mini for Week 1 only
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_FAST},
                {"role": "user", "content": get_week1_prompt(user_profile)}
            ],
            response_format={"type": "json_object"},
            temperature=0.6,
            max_tokens=2500,  # Reduced from 8000 - only need Week 1
        )
        
        # Parse the response
        raw_content = response.choices[0].message.content
        fixed_content = fix_json_string(raw_content)
        
        try:
            plan_data = json.loads(fixed_content)
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            raise Exception(f"Failed to parse AI response: {str(e)}")
        
        # Calculate dates
        today = datetime.now()
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        start_date = today + timedelta(days=days_until_monday)
        
        # Transform Week 1 to the format expected by the frontend
        plan_id = str(uuid.uuid4())
        goal = user_profile.get("goal_primary", "maintenance")
        experience = user_profile.get("experience_level", "intermediate")
        
        transformed_plan = {
            "id": plan_id,
            "name": plan_data.get("plan_name", "4-Week Personalized Plan"),
            "coach_message": plan_data.get("coach_message", "Let's crush your fitness goals!"),
            "goal": goal,
            "experience_level": experience,
            "total_weeks": 4,
            "created_at": datetime.now().isoformat(),
            "user_id": user_id,
            "weeks": []
        }
        
        # Process Week 1 from AI
        day_name_to_index = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
            "Friday": 4, "Saturday": 5, "Sunday": 6
        }
        
        week1_data = plan_data.get("week", {})
        week1_workouts = []
        
        for workout_data in week1_data.get("workouts", []):
            day_name = workout_data.get("day_name", "Monday")
            day_index = day_name_to_index.get(day_name, 0)
            
            workout_obj = {
                "id": str(uuid.uuid4()),
                "name": workout_data.get("workout_name", "Workout"),
                "day_name": day_name,
                "day_of_week": day_index,
                "day_number": len(week1_workouts) + 1,
                "duration_minutes": workout_data.get("duration_minutes", 45),
                "focus_areas": workout_data.get("focus_areas", []),
                "exercises": workout_data.get("exercises", [])
            }
            week1_workouts.append(workout_obj)
        
        # Add Week 1 to plan
        week1_end = start_date + timedelta(days=6)
        transformed_plan["weeks"].append({
            "id": str(uuid.uuid4()),
            "week_number": 1,
            "theme": week1_data.get("theme", "Foundation Week"),
            "coach_note": "",
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": week1_end.strftime("%Y-%m-%d"),
            "workouts": week1_workouts,
            "total_workouts": len(week1_workouts)
        })
        
        # Generate progressive weeks 2-4 programmatically
        progressive_weeks = create_progressive_weeks(week1_workouts, goal, experience)
        
        for i, week_data in enumerate(progressive_weeks, start=2):
            week_start = start_date + timedelta(weeks=i - 1)
            week_end = week_start + timedelta(days=6)
            
            transformed_plan["weeks"].append({
                "id": str(uuid.uuid4()),
                "week_number": i,
                "theme": week_data["theme"],
                "coach_note": "",
                "start_date": week_start.strftime("%Y-%m-%d"),
                "end_date": week_end.strftime("%Y-%m-%d"),
                "workouts": week_data["workouts"],
                "total_workouts": len(week_data["workouts"])
            })
        
        # Add token usage info
        usage = response.usage
        transformed_plan["_meta"] = {
            "model": "gpt-4o-mini",
            "mode": "fast",
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


def add_active_rest_to_plan(plan: Dict[str, Any], user_profile: Dict[str, Any]) -> Dict[str, Any]:
    """Add active rest days to a generated workout plan."""
    # Import from the original file to reuse the function
    from ai_plan_generator import add_active_rest_to_plan as _add_rest
    return _add_rest(plan, user_profile)


async def generate_ai_plan_with_fallback_fast(user_profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    FAST version: Generate plan with AI, with automatic retry on failure.
    Falls back to template-based generation if AI fails repeatedly.
    Adds active rest days if configured by user.
    """
    from plan_generator import generate_4_week_plan
    from ai_plan_generator import add_active_rest_to_plan
    
    max_retries = 2
    last_error = None
    
    for attempt in range(max_retries):
        try:
            plan = await generate_ai_plan_fast(user_profile)
            # Add active rest days if configured
            plan = add_active_rest_to_plan(plan, user_profile)
            return plan
        except Exception as e:
            last_error = e
            print(f"AI plan generation attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                import asyncio
                await asyncio.sleep(1)
                continue
    
    # AI failed, fall back to template-based generation
    print(f"AI generation failed after {max_retries} attempts, using template fallback")
    try:
        template_plan = generate_4_week_plan(user_profile)
        
        goal = user_profile.get("goal_primary", "fitness")
        coach_messages = {
            "fat_loss": "Your fat loss journey starts now! This plan is designed to maximize calorie burn while building lean muscle.",
            "muscle_gain": "Time to build strength and muscle! Focus on progressive overload and proper nutrition.",
            "endurance": "Let's build your stamina and endurance! Consistency is key to lasting results.",
            "maintenance": "Great choice to maintain your fitness! This balanced plan keeps you active and healthy.",
        }
        template_plan["coach_message"] = coach_messages.get(goal, "Let's crush your fitness goals together!")
        template_plan["_meta"] = {
            "model": "template-fallback",
            "note": "AI generation failed, using template-based plan",
            "estimated_cost_usd": 0.0
        }
        
        template_plan = add_active_rest_to_plan(template_plan, user_profile)
        return template_plan
    except Exception as template_error:
        raise last_error
