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
Create a high-quality, professional fitness photograph showing a {gender_descriptor} performing a {exercise_name}.

Photography Style:
- Photo-realistic, professional gym photography
- Studio lighting with soft shadows
- Sharp focus on subject, slightly blurred gym background
- Modern, clean aesthetic matching premium fitness app design
- Professional color grading (cool tones, high contrast)
- Shot from optimal angle to show proper form
- Appears as if from a professional fitness magazine or app

Subject Requirements:
- Real-looking {gender_descriptor} with defined, athletic physique
- Professional athletic attire (fitted tank top, athletic shorts/leggings)
- Medium skin tone with healthy appearance
- Focused, determined expression
- Proper exercise form and positioning
- Visible muscle engagement for {muscle_group}

Setting:
- High-end modern gym environment
- Professional equipment (commercial quality)
- Clean, organized space with soft background blur
- Studio-style lighting setup
- Dark or neutral background to highlight subject

Composition:
- Professional sports photography composition
- Shows critical phase of {exercise_name}
- Clear view of proper body alignment and form
- Emphasis on {muscle_group} engagement
- Shot angle that demonstrates correct technique

Technical Quality:
- High resolution, professional photography quality
- Proper exposure and lighting
- Sharp details on subject, shallow depth of field on background
- Looks like it could be from Nike, Peloton, or Apple Fitness
- Premium, aspirational aesthetic

The image should inspire users while clearly demonstrating perfect form for {exercise_name}.
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
