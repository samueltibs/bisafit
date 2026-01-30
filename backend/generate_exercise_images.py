"""
Exercise Image Library Generator

This script generates all missing exercise images for the BisaFit app.
Images are saved to /app/frontend/public/exercise-media/

Run this script ONCE to populate the entire image library.
After generation, images are served statically with no ongoing AI costs.
"""

import os
import sys
import asyncio
import base64
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, '/app/backend')

from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

# Initialize
api_key = os.environ.get('EMERGENT_LLM_KEY')
if not api_key:
    print("ERROR: EMERGENT_LLM_KEY not found in environment")
    sys.exit(1)

image_generator = OpenAIImageGeneration(api_key=api_key)

# Output directory
OUTPUT_DIR = Path('/app/frontend/public/exercise-media')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
(OUTPUT_DIR / 'male').mkdir(exist_ok=True)
(OUTPUT_DIR / 'female').mkdir(exist_ok=True)

# All exercises that need images (extracted from exerciseMediaData.ts)
# Format: (filename, exercise_name, needs_gender_variants)
EXERCISES_TO_GENERATE = [
    # Warmup
    ('jog-in-place.png', 'Jog in Place', False),
    ('jumping-jacks.png', 'Jumping Jacks', True),
    ('high-knees.png', 'High Knees', True),
    ('butt-kicks.png', 'Butt Kicks', False),
    ('arm-circles.png', 'Arm Circles', False),
    ('hip-circles.png', 'Hip Circles', False),
    ('leg-swings.png', 'Leg Swings', False),
    ('lateral-leg-swings.png', 'Lateral Leg Swings', False),
    ('torso-twists.png', 'Torso Twists', False),
    ('neck-rolls.png', 'Neck Rolls', False),
    ('shoulder-rolls.png', 'Shoulder Rolls', False),
    ('wrist-circles.png', 'Wrist Circles', False),
    ('ankle-circles.png', 'Ankle Circles', False),
    ('march-in-place.png', 'March in Place', False),
    ('worlds-greatest-stretch.png', 'World\'s Greatest Stretch', False),
    ('inchworm.png', 'Inchworm', False),
    
    # Lower Body
    ('squat.png', 'Bodyweight Squat', True),
    ('goblet-squat.png', 'Goblet Squat with Dumbbell', True),
    ('sumo-squat.png', 'Sumo Squat', True),
    ('bulgarian-split-squat.png', 'Bulgarian Split Squat', True),
    ('lunge.png', 'Forward Lunge', True),
    ('walking-lunge.png', 'Walking Lunge', False),
    ('lateral-lunge.png', 'Lateral Lunge', False),
    ('curtsy-lunge.png', 'Curtsy Lunge', False),
    ('romanian-deadlift.png', 'Romanian Deadlift with Dumbbells', True),
    ('single-leg-rdl.png', 'Single Leg Romanian Deadlift', False),
    ('good-morning.png', 'Good Morning Exercise', False),
    ('hip-hinge.png', 'Hip Hinge', False),
    ('glute-bridge.png', 'Glute Bridge', True),
    ('single-leg-glute-bridge.png', 'Single Leg Glute Bridge', False),
    ('hip-thrust.png', 'Barbell Hip Thrust', True),
    ('clamshell.png', 'Clamshell Exercise', False),
    ('fire-hydrant.png', 'Fire Hydrant Exercise', False),
    ('donkey-kick.png', 'Donkey Kick', False),
    ('calf-raise.png', 'Standing Calf Raise', True),
    ('single-leg-calf-raise.png', 'Single Leg Calf Raise', False),
    ('step-up.png', 'Step Up Exercise', False),
    ('lateral-step-up.png', 'Lateral Step Up', False),
    ('wall-sit.png', 'Wall Sit', False),
    
    # Upper Body Push
    ('push-up.png', 'Push Up', True),
    ('incline-push-up.png', 'Incline Push Up', False),
    ('decline-push-up.png', 'Decline Push Up', False),
    ('diamond-push-up.png', 'Diamond Push Up', False),
    ('wide-push-up.png', 'Wide Push Up', False),
    ('knee-push-up.png', 'Knee Push Up', False),
    ('db-bench-press.png', 'Dumbbell Bench Press', True),
    ('floor-press.png', 'Floor Press with Dumbbells', False),
    ('dumbbell-fly.png', 'Dumbbell Chest Fly', True),
    ('db-overhead-press.png', 'Standing Dumbbell Shoulder Press', True),
    ('seated-dumbbell-press.png', 'Seated Dumbbell Press', False),
    ('arnold-press.png', 'Arnold Press', False),
    ('pike-push-up.png', 'Pike Push Up', False),
    ('lateral-raise.png', 'Dumbbell Lateral Raise', True),
    ('front-raise.png', 'Front Raise', False),
    ('triceps-extension.png', 'Triceps Extension', False),
    ('overhead-triceps-extension.png', 'Overhead Triceps Extension', False),
    ('tricep-dip.png', 'Tricep Dip on Bench', True),
    ('bench-dip.png', 'Bench Dip', False),
    ('triceps-kickback.png', 'Triceps Kickback', False),
    ('skull-crusher.png', 'Skull Crusher', False),
    
    # Upper Body Pull
    ('db-row.png', 'Dumbbell Bent Over Row', False),
    ('single-arm-row.png', 'Single Arm Dumbbell Row', False),
    ('bent-over-row.png', 'Bent Over Row', False),
    ('renegade-row.png', 'Renegade Row', False),
    ('inverted-row.png', 'Inverted Row', False),
    ('upright-row.png', 'Upright Row', False),
    ('lat-pulldown.png', 'Lat Pulldown', False),
    ('pull-up.png', 'Pull Up', False),
    ('chin-up.png', 'Chin Up', False),
    ('bicep-curl.png', 'Dumbbell Bicep Curl', True),
    ('hammer-curl.png', 'Hammer Curl', False),
    ('concentration-curl.png', 'Concentration Curl', False),
    ('incline-curl.png', 'Incline Dumbbell Curl', False),
    ('reverse-fly.png', 'Reverse Fly', False),
    ('rear-delt-fly.png', 'Rear Delt Fly', False),
    ('face-pull.png', 'Face Pull with Cable', False),
    ('shrug.png', 'Dumbbell Shrug', False),
    
    # Core
    ('plank.png', 'Forearm Plank', True),
    ('side-plank.png', 'Side Plank', True),
    ('high-plank.png', 'High Plank', False),
    ('plank-shoulder-tap.png', 'Plank Shoulder Tap', False),
    ('plank-to-pushup.png', 'Plank to Push Up', False),
    ('crunch.png', 'Crunch', False),
    ('bicycle-crunch.png', 'Bicycle Crunch', True),
    ('reverse-crunch.png', 'Reverse Crunch', False),
    ('sit-up.png', 'Sit Up', False),
    ('v-up.png', 'V Up', False),
    ('dead-bug.png', 'Dead Bug Exercise', True),
    ('bird-dog.png', 'Bird Dog Exercise', False),
    ('leg-raise.png', 'Lying Leg Raise', False),
    ('lying-leg-raise.png', 'Lying Leg Raise', False),
    ('flutter-kick.png', 'Flutter Kicks', False),
    ('scissor-kick.png', 'Scissor Kicks', False),
    ('mountain-climbers.png', 'Mountain Climbers', True),
    ('cross-body-mountain-climber.png', 'Cross Body Mountain Climber', False),
    ('russian-twist.png', 'Russian Twist', True),
    ('seated-twist.png', 'Seated Twist', False),
    ('wood-chop.png', 'Wood Chop Exercise', False),
    ('hollow-body-hold.png', 'Hollow Body Hold', False),
    ('superman.png', 'Superman Exercise', True),
    ('ab-wheel-rollout.png', 'Ab Wheel Rollout', False),
    
    # Conditioning
    ('burpees.png', 'Burpee', True),
    ('squat-jump.png', 'Squat Jump', False),
    ('lunge-jump.png', 'Lunge Jump', False),
    ('jumping-lunges.png', 'Jumping Lunges', False),
    ('box-jump.png', 'Box Jump', False),
    ('broad-jump.png', 'Broad Jump', False),
    ('skater.png', 'Skater Exercise', False),
    ('tuck-jump.png', 'Tuck Jump', False),
    ('star-jump.png', 'Star Jump', False),
    ('speed-skater.png', 'Speed Skater', False),
    ('sprint.png', 'Sprint', False),
    ('shuttle-run.png', 'Shuttle Run', False),
    ('bear-crawl.png', 'Bear Crawl', False),
    ('frog-jump.png', 'Frog Jump', False),
    ('battle-rope.png', 'Battle Rope Waves', False),
    
    # Mobility/Stretches
    ('quad-stretch.png', 'Standing Quad Stretch', False),
    ('standing-quad-stretch.png', 'Standing Quad Stretch', False),
    ('hamstring-stretch.png', 'Standing Hamstring Stretch', False),
    ('standing-hamstring-stretch.png', 'Standing Hamstring Stretch', False),
    ('seated-hamstring-stretch.png', 'Seated Hamstring Stretch', False),
    ('hip-flexor-stretch.png', 'Kneeling Hip Flexor Stretch', False),
    ('kneeling-hip-flexor-stretch.png', 'Kneeling Hip Flexor Stretch', False),
    ('pigeon-pose.png', 'Pigeon Pose Stretch', False),
    ('figure-four-stretch.png', 'Figure Four Stretch', False),
    ('seated-glute-stretch.png', 'Seated Glute Stretch', False),
    ('calf-stretch.png', 'Calf Stretch Against Wall', False),
    ('standing-calf-stretch.png', 'Standing Calf Stretch', False),
    ('chest-stretch.png', 'Chest Stretch', False),
    ('doorway-chest-stretch.png', 'Doorway Chest Stretch', False),
    ('shoulder-stretch.png', 'Cross Body Shoulder Stretch', False),
    ('cross-body-shoulder-stretch.png', 'Cross Body Shoulder Stretch', False),
    ('triceps-stretch.png', 'Overhead Triceps Stretch', False),
    ('overhead-triceps-stretch.png', 'Overhead Triceps Stretch', False),
    ('lat-stretch.png', 'Standing Lat Stretch', False),
    ('standing-side-stretch.png', 'Standing Side Stretch', False),
    ('cat-cow.png', 'Cat Cow Stretch', False),
    ('childs-pose.png', 'Child\'s Pose', False),
    ('cobra-stretch.png', 'Cobra Stretch', False),
    ('upward-dog.png', 'Upward Dog Pose', False),
    ('downward-dog.png', 'Downward Dog Pose', False),
    ('spinal-twist.png', 'Supine Spinal Twist', False),
    ('seated-spinal-twist.png', 'Seated Spinal Twist', False),
    ('forward-fold.png', 'Standing Forward Fold', False),
    ('standing-forward-fold.png', 'Standing Forward Fold', False),
    ('butterfly-stretch.png', 'Butterfly Stretch', False),
    ('hip-90-90-stretch.png', 'Hip 90/90 Stretch', False),
    ('thoracic-rotation.png', 'Thoracic Rotation', False),
    ('thread-the-needle.png', 'Thread the Needle Stretch', False),
    ('scorpion-stretch.png', 'Scorpion Stretch', False),
    ('deep-breathing.png', 'Deep Breathing Exercise', False),
    ('full-body-stretch.png', 'Full Body Stretch', False),
]


def create_prompt(exercise_name: str, gender: str = "neutral") -> str:
    """Create optimized prompt for exercise image generation"""
    
    if gender == "male":
        subject = "athletic man with defined muscles"
    elif gender == "female":
        subject = "athletic woman with toned physique"
    else:
        subject = "athletic person"
    
    return f"""Professional fitness photography of a {subject} demonstrating the {exercise_name} exercise.

Style: High-end gym photography, clean modern aesthetic
- Professional studio lighting with soft shadows
- Sharp focus on subject, slightly blurred gym background  
- Shot from optimal angle to show proper form
- Dark/neutral background to highlight subject
- Premium fitness app quality (Nike, Peloton style)

Subject: {subject} in fitted athletic wear, focused expression, demonstrating perfect form for {exercise_name}.

Composition: Sports photography style, emphasizes proper technique and muscle engagement."""


async def generate_single_image(filename: str, exercise_name: str, gender: str = "neutral") -> bool:
    """Generate a single exercise image"""
    
    # Determine output path
    if gender == "male":
        output_path = OUTPUT_DIR / 'male' / filename
    elif gender == "female":
        output_path = OUTPUT_DIR / 'female' / filename
    else:
        output_path = OUTPUT_DIR / filename
    
    # Skip if already exists
    if output_path.exists():
        print(f"  ✓ Already exists: {output_path.name}")
        return True
    
    try:
        prompt = create_prompt(exercise_name, gender)
        
        images = await image_generator.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            # Save image
            with open(output_path, 'wb') as f:
                f.write(images[0])
            
            print(f"  ✓ Generated: {output_path.name}")
            return True
        else:
            print(f"  ✗ No image returned for: {filename}")
            return False
            
    except Exception as e:
        print(f"  ✗ Error generating {filename}: {e}")
        return False


async def generate_all_images():
    """Generate all missing exercise images"""
    
    print("=" * 60)
    print("BisaFit Exercise Image Library Generator")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Output directory: {OUTPUT_DIR}")
    print()
    
    total_to_generate = 0
    generated_count = 0
    skipped_count = 0
    failed_count = 0
    
    # Count total images needed
    for filename, exercise_name, needs_gender in EXERCISES_TO_GENERATE:
        if needs_gender:
            total_to_generate += 3  # neutral + male + female
        else:
            total_to_generate += 1
    
    print(f"Total images to check: {total_to_generate}")
    print()
    
    for i, (filename, exercise_name, needs_gender) in enumerate(EXERCISES_TO_GENERATE):
        print(f"[{i+1}/{len(EXERCISES_TO_GENERATE)}] {exercise_name}")
        
        # Generate neutral version
        if await generate_single_image(filename, exercise_name, "neutral"):
            if not (OUTPUT_DIR / filename).exists():
                generated_count += 1
            else:
                skipped_count += 1
        else:
            failed_count += 1
        
        # Generate gender variants if needed
        if needs_gender:
            # Male version
            if await generate_single_image(filename, exercise_name, "male"):
                if not (OUTPUT_DIR / 'male' / filename).exists():
                    generated_count += 1
                else:
                    skipped_count += 1
            else:
                failed_count += 1
            
            # Female version
            if await generate_single_image(filename, exercise_name, "female"):
                if not (OUTPUT_DIR / 'female' / filename).exists():
                    generated_count += 1
                else:
                    skipped_count += 1
            else:
                failed_count += 1
        
        # Small delay to avoid rate limiting
        await asyncio.sleep(0.5)
    
    print()
    print("=" * 60)
    print("Generation Complete!")
    print("=" * 60)
    print(f"Generated: {generated_count}")
    print(f"Skipped (already existed): {skipped_count}")
    print(f"Failed: {failed_count}")
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # List all files
    total_files = len(list(OUTPUT_DIR.glob('*.png')))
    male_files = len(list((OUTPUT_DIR / 'male').glob('*.png')))
    female_files = len(list((OUTPUT_DIR / 'female').glob('*.png')))
    
    print(f"Total files in library:")
    print(f"  - Neutral: {total_files}")
    print(f"  - Male: {male_files}")
    print(f"  - Female: {female_files}")
    print(f"  - TOTAL: {total_files + male_files + female_files}")


if __name__ == "__main__":
    asyncio.run(generate_all_images())
