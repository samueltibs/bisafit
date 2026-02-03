"""
Pre-populate Exercise Image Cache

Run this script to generate and cache images for common exercises.
This saves credits in the long run - each exercise only needs to be generated once!

Usage: python populate_image_cache.py
"""

import asyncio
import os
import sys

# Load environment
sys.path.insert(0, '/app/backend')
with open('/app/backend/.env') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            key, value = line.strip().split('=', 1)
            os.environ[key] = value.strip('"').strip("'")

from exercise_image_cache import get_or_generate_exercise_image, get_cached_image

# Common exercises to pre-generate
COMMON_EXERCISES = [
    # Warmup exercises
    {"name": "Jumping Jacks", "muscle_group": "cardio"},
    {"name": "High Knees", "muscle_group": "cardio"},
    {"name": "Arm Circles", "muscle_group": "shoulders"},
    {"name": "Leg Swings", "muscle_group": "legs"},
    {"name": "Hip Circles", "muscle_group": "hips"},
    {"name": "March in Place", "muscle_group": "cardio"},
    {"name": "Butt Kicks", "muscle_group": "legs"},
    {"name": "Torso Twists", "muscle_group": "core"},
    
    # Leg exercises
    {"name": "Squat", "muscle_group": "legs"},
    {"name": "Bodyweight Squat", "muscle_group": "legs"},
    {"name": "Goblet Squat", "muscle_group": "legs"},
    {"name": "Lunge", "muscle_group": "legs"},
    {"name": "Forward Lunge", "muscle_group": "legs"},
    {"name": "Reverse Lunge", "muscle_group": "legs"},
    {"name": "Walking Lunge", "muscle_group": "legs"},
    {"name": "Glute Bridge", "muscle_group": "glutes"},
    {"name": "Hip Thrust", "muscle_group": "glutes"},
    {"name": "Calf Raise", "muscle_group": "calves"},
    {"name": "Step Up", "muscle_group": "legs"},
    {"name": "Wall Sit", "muscle_group": "legs"},
    {"name": "Leg Press", "muscle_group": "legs"},
    {"name": "Deadlift", "muscle_group": "legs"},
    {"name": "Romanian Deadlift", "muscle_group": "hamstrings"},
    
    # Chest exercises
    {"name": "Push-up", "muscle_group": "chest"},
    {"name": "Push Up", "muscle_group": "chest"},
    {"name": "Incline Push-up", "muscle_group": "chest"},
    {"name": "Decline Push-up", "muscle_group": "chest"},
    {"name": "Diamond Push-up", "muscle_group": "chest"},
    {"name": "Wide Push-up", "muscle_group": "chest"},
    {"name": "Bench Press", "muscle_group": "chest"},
    {"name": "Dumbbell Press", "muscle_group": "chest"},
    {"name": "Dumbbell Chest Press", "muscle_group": "chest"},
    {"name": "Chest Fly", "muscle_group": "chest"},
    {"name": "Dumbbell Fly", "muscle_group": "chest"},
    
    # Back exercises
    {"name": "Dumbbell Row", "muscle_group": "back"},
    {"name": "Bent Over Row", "muscle_group": "back"},
    {"name": "Single Arm Row", "muscle_group": "back"},
    {"name": "Superman", "muscle_group": "back"},
    {"name": "Reverse Fly", "muscle_group": "back"},
    {"name": "Lat Pulldown", "muscle_group": "back"},
    {"name": "Pull Up", "muscle_group": "back"},
    {"name": "Chin Up", "muscle_group": "back"},
    
    # Shoulder exercises
    {"name": "Shoulder Press", "muscle_group": "shoulders"},
    {"name": "Overhead Press", "muscle_group": "shoulders"},
    {"name": "Dumbbell Shoulder Press", "muscle_group": "shoulders"},
    {"name": "Lateral Raise", "muscle_group": "shoulders"},
    {"name": "Front Raise", "muscle_group": "shoulders"},
    {"name": "Arnold Press", "muscle_group": "shoulders"},
    {"name": "Upright Row", "muscle_group": "shoulders"},
    {"name": "Face Pull", "muscle_group": "shoulders"},
    
    # Arm exercises
    {"name": "Bicep Curl", "muscle_group": "arms"},
    {"name": "Dumbbell Curl", "muscle_group": "arms"},
    {"name": "Hammer Curl", "muscle_group": "arms"},
    {"name": "Concentration Curl", "muscle_group": "arms"},
    {"name": "Tricep Dip", "muscle_group": "arms"},
    {"name": "Tricep Extension", "muscle_group": "arms"},
    {"name": "Overhead Tricep Extension", "muscle_group": "arms"},
    {"name": "Tricep Kickback", "muscle_group": "arms"},
    {"name": "Skull Crusher", "muscle_group": "arms"},
    
    # Core exercises
    {"name": "Plank", "muscle_group": "core"},
    {"name": "Side Plank", "muscle_group": "core"},
    {"name": "Dead Bug", "muscle_group": "core"},
    {"name": "Bird Dog", "muscle_group": "core"},
    {"name": "Mountain Climber", "muscle_group": "core"},
    {"name": "Crunch", "muscle_group": "core"},
    {"name": "Bicycle Crunch", "muscle_group": "core"},
    {"name": "Russian Twist", "muscle_group": "core"},
    {"name": "Leg Raise", "muscle_group": "core"},
    {"name": "Flutter Kicks", "muscle_group": "core"},
    {"name": "V-Up", "muscle_group": "core"},
    {"name": "Sit Up", "muscle_group": "core"},
    {"name": "Ab Rollout", "muscle_group": "core"},
    
    # Cooldown/Stretches
    {"name": "Hamstring Stretch", "muscle_group": "stretch"},
    {"name": "Quad Stretch", "muscle_group": "stretch"},
    {"name": "Child's Pose", "muscle_group": "stretch"},
    {"name": "Cat Cow Stretch", "muscle_group": "stretch"},
    {"name": "Shoulder Stretch", "muscle_group": "stretch"},
    {"name": "Chest Stretch", "muscle_group": "stretch"},
    {"name": "Hip Flexor Stretch", "muscle_group": "stretch"},
    {"name": "Pigeon Pose", "muscle_group": "stretch"},
    {"name": "Cobra Stretch", "muscle_group": "stretch"},
    {"name": "Standing Forward Fold", "muscle_group": "stretch"},
    
    # Cardio
    {"name": "Burpee", "muscle_group": "cardio"},
    {"name": "Jump Squat", "muscle_group": "cardio"},
    {"name": "Box Jump", "muscle_group": "cardio"},
    {"name": "Jumping Lunge", "muscle_group": "cardio"},
    {"name": "Skater", "muscle_group": "cardio"},
    {"name": "Bear Crawl", "muscle_group": "cardio"},
]


async def populate_cache():
    print(f"\n{'='*60}")
    print(f"  EXERCISE IMAGE CACHE POPULATION")
    print(f"  {len(COMMON_EXERCISES)} exercises to process")
    print(f"{'='*60}\n")
    
    cached_count = 0
    generated_count = 0
    failed_count = 0
    
    for i, exercise in enumerate(COMMON_EXERCISES, 1):
        name = exercise["name"]
        muscle_group = exercise["muscle_group"]
        
        # Check if already cached
        existing = await get_cached_image(name)
        if existing:
            print(f"[{i}/{len(COMMON_EXERCISES)}] ✓ {name} (already cached)")
            cached_count += 1
            continue
        
        # Generate new image
        print(f"[{i}/{len(COMMON_EXERCISES)}] ⏳ Generating: {name}...")
        
        try:
            result = await get_or_generate_exercise_image(
                exercise_name=name,
                muscle_group=muscle_group,
                gender="neutral"
            )
            
            if result.get("generated"):
                print(f"[{i}/{len(COMMON_EXERCISES)}] ✅ Generated: {name}")
                generated_count += 1
            elif result.get("cached"):
                print(f"[{i}/{len(COMMON_EXERCISES)}] ✓ {name} (cached)")
                cached_count += 1
            else:
                print(f"[{i}/{len(COMMON_EXERCISES)}] ❌ Failed: {name} - {result.get('error', 'Unknown error')}")
                failed_count += 1
                
        except Exception as e:
            print(f"[{i}/{len(COMMON_EXERCISES)}] ❌ Error: {name} - {e}")
            failed_count += 1
    
    print(f"\n{'='*60}")
    print(f"  COMPLETE!")
    print(f"  Already cached: {cached_count}")
    print(f"  Newly generated: {generated_count}")
    print(f"  Failed: {failed_count}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(populate_cache())
