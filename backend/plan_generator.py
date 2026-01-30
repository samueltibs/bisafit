"""
Template-Based Workout Plan Generator

Generates personalized workout plans using pre-built templates.
NO AI CREDITS REQUIRED - uses algorithmic selection based on user profile.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import random
import uuid

# ============================================
# EXERCISE DATABASE
# ============================================

EXERCISES = {
    # Lower Body
    "lower": [
        {"name": "Bodyweight Squat", "muscle_group": "legs", "difficulty": "beginner", "equipment": []},
        {"name": "Goblet Squat", "muscle_group": "legs", "difficulty": "intermediate", "equipment": ["dumbbell"]},
        {"name": "Bulgarian Split Squat", "muscle_group": "legs", "difficulty": "advanced", "equipment": []},
        {"name": "Forward Lunge", "muscle_group": "legs", "difficulty": "beginner", "equipment": []},
        {"name": "Walking Lunge", "muscle_group": "legs", "difficulty": "intermediate", "equipment": []},
        {"name": "Romanian Deadlift", "muscle_group": "legs", "difficulty": "intermediate", "equipment": ["dumbbell", "barbell"]},
        {"name": "Glute Bridge", "muscle_group": "glutes", "difficulty": "beginner", "equipment": []},
        {"name": "Hip Thrust", "muscle_group": "glutes", "difficulty": "intermediate", "equipment": ["barbell", "bench"]},
        {"name": "Calf Raise", "muscle_group": "calves", "difficulty": "beginner", "equipment": []},
        {"name": "Step Up", "muscle_group": "legs", "difficulty": "intermediate", "equipment": ["bench"]},
        {"name": "Wall Sit", "muscle_group": "legs", "difficulty": "beginner", "equipment": []},
        {"name": "Sumo Squat", "muscle_group": "legs", "difficulty": "beginner", "equipment": []},
    ],
    
    # Upper Body Push
    "push": [
        {"name": "Push Up", "muscle_group": "chest", "difficulty": "beginner", "equipment": []},
        {"name": "Incline Push Up", "muscle_group": "chest", "difficulty": "beginner", "equipment": ["bench"]},
        {"name": "Diamond Push Up", "muscle_group": "triceps", "difficulty": "intermediate", "equipment": []},
        {"name": "Dumbbell Bench Press", "muscle_group": "chest", "difficulty": "intermediate", "equipment": ["dumbbell", "bench"]},
        {"name": "Dumbbell Shoulder Press", "muscle_group": "shoulders", "difficulty": "intermediate", "equipment": ["dumbbell"]},
        {"name": "Lateral Raise", "muscle_group": "shoulders", "difficulty": "beginner", "equipment": ["dumbbell"]},
        {"name": "Tricep Dip", "muscle_group": "triceps", "difficulty": "intermediate", "equipment": ["bench"]},
        {"name": "Pike Push Up", "muscle_group": "shoulders", "difficulty": "intermediate", "equipment": []},
        {"name": "Dumbbell Fly", "muscle_group": "chest", "difficulty": "intermediate", "equipment": ["dumbbell", "bench"]},
        {"name": "Overhead Triceps Extension", "muscle_group": "triceps", "difficulty": "beginner", "equipment": ["dumbbell"]},
    ],
    
    # Upper Body Pull
    "pull": [
        {"name": "Dumbbell Row", "muscle_group": "back", "difficulty": "beginner", "equipment": ["dumbbell"]},
        {"name": "Bent Over Row", "muscle_group": "back", "difficulty": "intermediate", "equipment": ["dumbbell", "barbell"]},
        {"name": "Inverted Row", "muscle_group": "back", "difficulty": "intermediate", "equipment": ["bar"]},
        {"name": "Pull Up", "muscle_group": "back", "difficulty": "advanced", "equipment": ["pull_up_bar"]},
        {"name": "Chin Up", "muscle_group": "back", "difficulty": "advanced", "equipment": ["pull_up_bar"]},
        {"name": "Bicep Curl", "muscle_group": "biceps", "difficulty": "beginner", "equipment": ["dumbbell"]},
        {"name": "Hammer Curl", "muscle_group": "biceps", "difficulty": "beginner", "equipment": ["dumbbell"]},
        {"name": "Reverse Fly", "muscle_group": "back", "difficulty": "intermediate", "equipment": ["dumbbell"]},
        {"name": "Face Pull", "muscle_group": "back", "difficulty": "intermediate", "equipment": ["cable", "band"]},
        {"name": "Shrug", "muscle_group": "traps", "difficulty": "beginner", "equipment": ["dumbbell"]},
    ],
    
    # Core
    "core": [
        {"name": "Plank", "muscle_group": "core", "difficulty": "beginner", "equipment": []},
        {"name": "Side Plank", "muscle_group": "core", "difficulty": "intermediate", "equipment": []},
        {"name": "Bicycle Crunch", "muscle_group": "core", "difficulty": "beginner", "equipment": []},
        {"name": "Mountain Climbers", "muscle_group": "core", "difficulty": "intermediate", "equipment": []},
        {"name": "Russian Twist", "muscle_group": "core", "difficulty": "intermediate", "equipment": []},
        {"name": "Dead Bug", "muscle_group": "core", "difficulty": "beginner", "equipment": []},
        {"name": "Bird Dog", "muscle_group": "core", "difficulty": "beginner", "equipment": []},
        {"name": "Leg Raise", "muscle_group": "core", "difficulty": "intermediate", "equipment": []},
        {"name": "Superman", "muscle_group": "core", "difficulty": "beginner", "equipment": []},
        {"name": "V Up", "muscle_group": "core", "difficulty": "advanced", "equipment": []},
    ],
    
    # Cardio/Conditioning
    "cardio": [
        {"name": "Jumping Jacks", "muscle_group": "full_body", "difficulty": "beginner", "equipment": []},
        {"name": "High Knees", "muscle_group": "full_body", "difficulty": "beginner", "equipment": []},
        {"name": "Burpee", "muscle_group": "full_body", "difficulty": "intermediate", "equipment": []},
        {"name": "Squat Jump", "muscle_group": "legs", "difficulty": "intermediate", "equipment": []},
        {"name": "Lunge Jump", "muscle_group": "legs", "difficulty": "advanced", "equipment": []},
        {"name": "Skater", "muscle_group": "legs", "difficulty": "intermediate", "equipment": []},
        {"name": "Box Jump", "muscle_group": "legs", "difficulty": "intermediate", "equipment": ["box"]},
        {"name": "Bear Crawl", "muscle_group": "full_body", "difficulty": "intermediate", "equipment": []},
    ],
    
    # Warmup
    "warmup": [
        {"name": "Jog in Place", "muscle_group": "full_body", "difficulty": "beginner", "equipment": []},
        {"name": "Arm Circles", "muscle_group": "shoulders", "difficulty": "beginner", "equipment": []},
        {"name": "Hip Circles", "muscle_group": "hips", "difficulty": "beginner", "equipment": []},
        {"name": "Leg Swings", "muscle_group": "legs", "difficulty": "beginner", "equipment": []},
        {"name": "Torso Twists", "muscle_group": "core", "difficulty": "beginner", "equipment": []},
        {"name": "Inchworm", "muscle_group": "full_body", "difficulty": "beginner", "equipment": []},
    ],
    
    # Cooldown/Stretching
    "cooldown": [
        {"name": "Standing Quad Stretch", "muscle_group": "legs", "difficulty": "beginner", "equipment": []},
        {"name": "Standing Hamstring Stretch", "muscle_group": "legs", "difficulty": "beginner", "equipment": []},
        {"name": "Hip Flexor Stretch", "muscle_group": "hips", "difficulty": "beginner", "equipment": []},
        {"name": "Chest Stretch", "muscle_group": "chest", "difficulty": "beginner", "equipment": []},
        {"name": "Shoulder Stretch", "muscle_group": "shoulders", "difficulty": "beginner", "equipment": []},
        {"name": "Child's Pose", "muscle_group": "back", "difficulty": "beginner", "equipment": []},
        {"name": "Cat Cow", "muscle_group": "back", "difficulty": "beginner", "equipment": []},
        {"name": "Downward Dog", "muscle_group": "full_body", "difficulty": "beginner", "equipment": []},
    ],
}

# ============================================
# WORKOUT TEMPLATES
# ============================================

WORKOUT_TEMPLATES = {
    "full_body": {
        "name": "Full Body",
        "focus": ["lower", "push", "pull", "core"],
        "exercise_counts": {"lower": 2, "push": 2, "pull": 2, "core": 2},
    },
    "upper_body": {
        "name": "Upper Body",
        "focus": ["push", "pull", "core"],
        "exercise_counts": {"push": 3, "pull": 3, "core": 2},
    },
    "lower_body": {
        "name": "Lower Body",
        "focus": ["lower", "core"],
        "exercise_counts": {"lower": 5, "core": 2},
    },
    "push_day": {
        "name": "Push Day",
        "focus": ["push", "core"],
        "exercise_counts": {"push": 5, "core": 2},
    },
    "pull_day": {
        "name": "Pull Day",
        "focus": ["pull", "core"],
        "exercise_counts": {"pull": 5, "core": 2},
    },
    "core_cardio": {
        "name": "Core & Cardio",
        "focus": ["core", "cardio"],
        "exercise_counts": {"core": 4, "cardio": 4},
    },
    "hiit": {
        "name": "HIIT",
        "focus": ["cardio", "core"],
        "exercise_counts": {"cardio": 5, "core": 3},
    },
}

# Weekly split templates based on days per week
WEEKLY_SPLITS = {
    2: ["full_body", "full_body"],
    3: ["full_body", "full_body", "core_cardio"],
    4: ["upper_body", "lower_body", "upper_body", "lower_body"],
    5: ["push_day", "pull_day", "lower_body", "push_day", "pull_day"],
    6: ["push_day", "pull_day", "lower_body", "push_day", "pull_day", "core_cardio"],
}


def filter_exercises_by_equipment(exercises: List[Dict], available_equipment: List[str]) -> List[Dict]:
    """Filter exercises based on available equipment"""
    filtered = []
    for ex in exercises:
        required = ex.get("equipment", [])
        if not required:  # No equipment needed
            filtered.append(ex)
        elif any(eq in available_equipment for eq in required):
            filtered.append(ex)
    return filtered


def filter_exercises_by_difficulty(exercises: List[Dict], experience_level: str) -> List[Dict]:
    """Filter exercises based on user experience level"""
    difficulty_map = {
        "beginner": ["beginner"],
        "intermediate": ["beginner", "intermediate"],
        "advanced": ["beginner", "intermediate", "advanced"],
    }
    allowed = difficulty_map.get(experience_level, ["beginner", "intermediate"])
    return [ex for ex in exercises if ex.get("difficulty", "beginner") in allowed]


def get_sets_reps_for_goal(goal: str, experience: str) -> Dict[str, Any]:
    """Get sets and reps based on goal and experience"""
    configs = {
        "fat_loss": {
            "beginner": {"sets": 3, "reps": "12-15", "rest": 45},
            "intermediate": {"sets": 4, "reps": "12-15", "rest": 30},
            "advanced": {"sets": 4, "reps": "15-20", "rest": 30},
        },
        "muscle_gain": {
            "beginner": {"sets": 3, "reps": "8-12", "rest": 60},
            "intermediate": {"sets": 4, "reps": "8-12", "rest": 60},
            "advanced": {"sets": 4, "reps": "6-10", "rest": 90},
        },
        "endurance": {
            "beginner": {"sets": 2, "reps": "15-20", "rest": 30},
            "intermediate": {"sets": 3, "reps": "15-20", "rest": 30},
            "advanced": {"sets": 3, "reps": "20-25", "rest": 20},
        },
        "maintenance": {
            "beginner": {"sets": 3, "reps": "10-12", "rest": 60},
            "intermediate": {"sets": 3, "reps": "10-12", "rest": 45},
            "advanced": {"sets": 3, "reps": "10-12", "rest": 45},
        },
    }
    goal_config = configs.get(goal, configs["maintenance"])
    return goal_config.get(experience, goal_config["intermediate"])


def generate_workout(
    template_key: str,
    user_equipment: List[str],
    experience_level: str,
    goal: str,
    workout_day: int,
) -> Dict[str, Any]:
    """Generate a single workout based on template and user profile"""
    
    template = WORKOUT_TEMPLATES.get(template_key, WORKOUT_TEMPLATES["full_body"])
    set_rep_config = get_sets_reps_for_goal(goal, experience_level)
    
    exercises = []
    
    # Add warmup
    warmup_exercises = random.sample(EXERCISES["warmup"], min(3, len(EXERCISES["warmup"])))
    for ex in warmup_exercises:
        exercises.append({
            "name": ex["name"],
            "sets": 1,
            "reps": "30 seconds",
            "rest_seconds": 15,
            "muscle_group": ex["muscle_group"],
            "is_warmup": True,
        })
    
    # Add main exercises based on template
    for category, count in template["exercise_counts"].items():
        available = filter_exercises_by_equipment(EXERCISES.get(category, []), user_equipment)
        available = filter_exercises_by_difficulty(available, experience_level)
        
        if available:
            selected = random.sample(available, min(count, len(available)))
            for ex in selected:
                exercises.append({
                    "name": ex["name"],
                    "sets": set_rep_config["sets"],
                    "reps": set_rep_config["reps"],
                    "rest_seconds": set_rep_config["rest"],
                    "muscle_group": ex["muscle_group"],
                    "is_warmup": False,
                })
    
    # Add cooldown
    cooldown_exercises = random.sample(EXERCISES["cooldown"], min(3, len(EXERCISES["cooldown"])))
    for ex in cooldown_exercises:
        exercises.append({
            "name": ex["name"],
            "sets": 1,
            "reps": "30 seconds",
            "rest_seconds": 10,
            "muscle_group": ex["muscle_group"],
            "is_cooldown": True,
        })
    
    # Calculate duration estimate
    main_exercises = [e for e in exercises if not e.get("is_warmup") and not e.get("is_cooldown")]
    warmup_time = 5  # minutes
    cooldown_time = 5  # minutes
    main_time = len(main_exercises) * set_rep_config["sets"] * 1.5  # ~1.5 min per set
    total_duration = int(warmup_time + main_time + cooldown_time)
    
    return {
        "id": str(uuid.uuid4()),
        "name": template["name"],
        "day_number": workout_day,
        "duration_minutes": total_duration,
        "exercises": exercises,
        "focus_areas": template["focus"],
    }


def generate_weekly_plan(
    user_profile: Dict[str, Any],
    week_number: int = 1,
) -> Dict[str, Any]:
    """Generate a full week workout plan based on user profile"""
    
    # Extract user preferences
    workout_days_per_week = user_profile.get("workout_days_per_week", 3)
    equipment = user_profile.get("equipment", [])
    experience = user_profile.get("experience_level", "intermediate")
    goal = user_profile.get("goal_primary", "maintenance")
    preferred_days = user_profile.get("workout_days", [])
    
    # Map equipment names
    equipment_map = {
        "dumbbells": "dumbbell",
        "barbell": "barbell",
        "pull_up_bar": "pull_up_bar",
        "bench": "bench",
        "kettlebell": "kettlebell",
        "resistance_bands": "band",
        "cable_machine": "cable",
        "box": "box",
    }
    mapped_equipment = [equipment_map.get(eq, eq) for eq in equipment]
    
    # Get workout split
    split = WEEKLY_SPLITS.get(workout_days_per_week, WEEKLY_SPLITS[3])
    
    # Generate workouts for each day
    workouts = []
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    # Use preferred days or distribute evenly
    if preferred_days and len(preferred_days) >= workout_days_per_week:
        workout_day_indices = [day_names.index(d) for d in preferred_days[:workout_days_per_week] if d in day_names]
    else:
        # Distribute evenly across the week
        if workout_days_per_week == 2:
            workout_day_indices = [0, 3]  # Mon, Thu
        elif workout_days_per_week == 3:
            workout_day_indices = [0, 2, 4]  # Mon, Wed, Fri
        elif workout_days_per_week == 4:
            workout_day_indices = [0, 1, 3, 4]  # Mon, Tue, Thu, Fri
        elif workout_days_per_week == 5:
            workout_day_indices = [0, 1, 2, 3, 4]  # Mon-Fri
        else:
            workout_day_indices = [0, 1, 2, 3, 4, 5]  # Mon-Sat
    
    for i, day_idx in enumerate(workout_day_indices):
        template_key = split[i % len(split)]
        workout = generate_workout(
            template_key=template_key,
            user_equipment=mapped_equipment,
            experience_level=experience,
            goal=goal,
            workout_day=i + 1,
        )
        workout["day_name"] = day_names[day_idx]
        workout["day_of_week"] = day_idx
        workouts.append(workout)
    
    # Calculate plan dates
    today = datetime.now()
    # Start from next Monday
    days_until_monday = (7 - today.weekday()) % 7
    if days_until_monday == 0:
        days_until_monday = 7
    start_date = today + timedelta(days=days_until_monday)
    end_date = start_date + timedelta(days=6)
    
    return {
        "id": str(uuid.uuid4()),
        "week_number": week_number,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "workouts": workouts,
        "total_workouts": len(workouts),
        "goal": goal,
        "experience_level": experience,
        "created_at": datetime.now().isoformat(),
    }


def generate_4_week_plan(user_profile: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a complete 4-week workout plan"""
    
    weeks = []
    for week_num in range(1, 5):
        week_plan = generate_weekly_plan(user_profile, week_number=week_num)
        weeks.append(week_plan)
    
    return {
        "id": str(uuid.uuid4()),
        "name": f"4-Week {user_profile.get('goal_primary', 'Fitness').replace('_', ' ').title()} Plan",
        "weeks": weeks,
        "total_weeks": 4,
        "user_id": user_profile.get("user_id"),
        "created_at": datetime.now().isoformat(),
        "goal": user_profile.get("goal_primary", "maintenance"),
        "experience_level": user_profile.get("experience_level", "intermediate"),
    }
