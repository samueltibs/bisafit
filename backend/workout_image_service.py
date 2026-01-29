"""
Workout Image Generation Service

Generates AI-powered workout form guide images using OpenAI DALL-E 3.
Images are gender-specific and follow a consistent illustrated style.
"""

from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
import os
import base64
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI Image Generator
api_key = os.environ.get('EMERGENT_LLM_KEY')
image_generator = OpenAIImageGeneration(api_key=api_key) if api_key else None


def create_workout_form_prompt(
    exercise_name: str,
    gender: str = "male",
    muscle_group: str = "full body"
) -> str:
    """
    Create a detailed prompt for generating workout form guide images.
    
    Args:
        exercise_name: Name of the exercise (e.g., "Barbell Squat", "Dumbbell Bench Press")
        gender: "male" or "female" for gender-specific illustration
        muscle_group: Primary muscle group (e.g., "legs", "chest", "back")
    
    Returns:
        Detailed prompt string for image generation
    """
    
    gender_descriptor = "athletic man" if gender.lower() == "male" else "athletic woman"
    
    prompt = f"""
Create a professional fitness form guide illustration showing a {gender_descriptor} performing a {exercise_name}.

Style Requirements:
- Clean, modern 2D digital illustration style
- Bright, vibrant colors (blues, greens, oranges)
- Simplified, slightly blurred background (gym environment)
- Defined but not exaggerated musculature
- Professional fitness attire (tank top, shorts/leggings)
- Warm medium skin tone
- Focused, determined facial expression

Visual Elements to Include:
- 4 orange callout circles highlighting key form points:
  * Back position/posture
  * Hand/grip placement
  * Knee/hip alignment
  * Foot position and stance
- 2 orange checkmarks (✓) on correct form elements
- 2 bold orange downward arrows showing movement direction
- Inset circular images showing:
  * Close-up of grip/hand position (upper left)
  * Front view of stance/alignment (upper right)
  * Side view of feet/ankle position (lower right)

Composition:
- Main figure in the critical phase of {exercise_name}
- Dynamic pose showing proper form
- Focus on {muscle_group} engagement
- Professional gym setting with equipment
- Clean white or light background with subtle gym elements

Technical: High resolution, suitable for mobile display, educational fitness guide quality.
"""
    
    return prompt.strip()


async def generate_workout_image(
    exercise_name: str,
    gender: str = "male",
    muscle_group: str = "full body"
) -> dict:
    """
    Generate a workout form guide image using OpenAI.
    
    Args:
        exercise_name: Name of the exercise
        gender: User's gender for personalized image
        muscle_group: Primary muscle group targeted
    
    Returns:
        dict with image_base64 and metadata
    """
    
    if not image_generator:
        raise ValueError("Image generator not initialized. Check EMERGENT_LLM_KEY.")
    
    # Create detailed prompt
    prompt = create_workout_form_prompt(exercise_name, gender, muscle_group)
    
    try:
        # Generate image using OpenAI
        images = await image_generator.generate_images(
            prompt=prompt,
            model="gpt-image-1",  # DALL-E 3
            number_of_images=1
        )
        
        if images and len(images) > 0:
            # Convert to base64
            image_base64 = f"data:image/png;base64,{base64.b64encode(images[0]).decode('utf-8')}"
            
            return {
                "image_base64": image_base64,
                "exercise_name": exercise_name,
                "gender": gender,
                "muscle_group": muscle_group,
                "model": "gpt-image-1"
            }
        else:
            raise ValueError("No image was generated")
            
    except Exception as e:
        print(f"Error generating workout image: {e}")
        raise


async def generate_workout_images_batch(
    exercises: list[dict],
    gender: str = "male"
) -> list[dict]:
    """
    Generate multiple workout images in batch.
    
    Args:
        exercises: List of dicts with exercise_name and muscle_group
        gender: User's gender
    
    Returns:
        List of generated image results
    """
    results = []
    
    for exercise in exercises:
        try:
            result = await generate_workout_image(
                exercise_name=exercise.get("exercise_name"),
                gender=gender,
                muscle_group=exercise.get("muscle_group", "full body")
            )
            results.append(result)
        except Exception as e:
            print(f"Failed to generate image for {exercise.get('exercise_name')}: {e}")
            results.append({
                "exercise_name": exercise.get("exercise_name"),
                "error": str(e),
                "image_base64": None
            })
    
    return results
