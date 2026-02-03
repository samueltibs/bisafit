"""
Exercise Image Cache Service

Smart caching for AI-generated exercise images:
- First request: Generate with AI, save to Supabase storage, cache URL
- Subsequent requests: Return cached URL instantly (no credits used)

Saves credits by generating each exercise image only ONCE.
"""

import os
import base64
import hashlib
from typing import Optional, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', os.environ.get('SUPABASE_KEY', ''))

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def normalize_exercise_name(name: str) -> str:
    """Normalize exercise name for consistent cache lookups"""
    return (name.lower()
            .strip()
            .replace('-', ' ')
            .replace('_', ' ')
            .replace('  ', ' '))


async def get_cached_image(exercise_name: str, gender: str = 'neutral') -> Optional[str]:
    """
    Get cached image URL for an exercise.
    Returns None if not cached.
    """
    if not supabase:
        return None
    
    normalized = normalize_exercise_name(exercise_name)
    
    try:
        result = supabase.table('exercise_image_cache').select('image_url').eq(
            'exercise_name_normalized', normalized
        ).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]['image_url']
    except Exception as e:
        print(f"[ImageCache] Error checking cache: {e}")
    
    return None


async def save_to_cache(exercise_name: str, image_url: str, gender: str = 'neutral') -> bool:
    """
    Save an image URL to the cache.
    """
    if not supabase:
        return False
    
    normalized = normalize_exercise_name(exercise_name)
    
    try:
        supabase.table('exercise_image_cache').upsert({
            'exercise_name': exercise_name,
            'exercise_name_normalized': normalized,
            'image_url': image_url,
            'gender': gender,
        }, on_conflict='exercise_name_normalized').execute()
        return True
    except Exception as e:
        print(f"[ImageCache] Error saving to cache: {e}")
        return False


async def upload_image_to_storage(
    image_base64: str, 
    exercise_name: str
) -> Optional[str]:
    """
    Upload a base64 image to Supabase storage and return the public URL.
    """
    if not supabase:
        return None
    
    try:
        # Create a unique filename
        normalized = normalize_exercise_name(exercise_name)
        filename = f"exercises/{hashlib.md5(normalized.encode()).hexdigest()}.png"
        
        # Decode base64
        image_data = base64.b64decode(image_base64)
        
        # Upload to storage
        result = supabase.storage.from_('exercise-images').upload(
            filename,
            image_data,
            {'content-type': 'image/png', 'upsert': 'true'}
        )
        
        # Get public URL
        public_url = supabase.storage.from_('exercise-images').get_public_url(filename)
        return public_url
        
    except Exception as e:
        print(f"[ImageCache] Error uploading to storage: {e}")
        return None


async def get_or_generate_exercise_image(
    exercise_name: str,
    muscle_group: str = 'full body',
    gender: str = 'neutral'
) -> Dict[str, Any]:
    """
    Get exercise image from cache, or generate and cache it.
    
    Returns:
        {
            "exercise_name": str,
            "image_url": str or None,
            "cached": bool,
            "generated": bool
        }
    """
    # Check cache first
    cached_url = await get_cached_image(exercise_name, gender)
    if cached_url:
        return {
            "exercise_name": exercise_name,
            "image_url": cached_url,
            "cached": True,
            "generated": False
        }
    
    # Not in cache - generate new image
    try:
        from workout_image_service import generate_workout_image
        
        result = await generate_workout_image(
            exercise_name=exercise_name,
            gender=gender,
            muscle_group=muscle_group
        )
        
        if result.get('image_base64'):
            # Upload to storage
            public_url = await upload_image_to_storage(
                result['image_base64'],
                exercise_name
            )
            
            if public_url:
                # Save to cache
                await save_to_cache(exercise_name, public_url, gender)
                
                return {
                    "exercise_name": exercise_name,
                    "image_url": public_url,
                    "cached": False,
                    "generated": True
                }
        
        return {
            "exercise_name": exercise_name,
            "image_url": None,
            "cached": False,
            "generated": False,
            "error": "Failed to generate image"
        }
        
    except Exception as e:
        print(f"[ImageCache] Error generating image for {exercise_name}: {e}")
        return {
            "exercise_name": exercise_name,
            "image_url": None,
            "cached": False,
            "generated": False,
            "error": str(e)
        }


async def batch_get_or_generate_images(
    exercises: list,
    gender: str = 'neutral'
) -> list:
    """
    Process multiple exercises - check cache first, generate missing ones.
    Returns list of results with image URLs.
    """
    results = []
    
    for ex in exercises:
        exercise_name = ex.get('exercise_name', ex.get('name', ''))
        muscle_group = ex.get('muscle_group', 'full body')
        
        if not exercise_name:
            continue
            
        result = await get_or_generate_exercise_image(
            exercise_name=exercise_name,
            muscle_group=muscle_group,
            gender=gender
        )
        results.append(result)
    
    return results
