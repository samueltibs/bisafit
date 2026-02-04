"""
Exercise Image Cache Service

Smart caching for AI-generated exercise images:
- First request: Generate with AI, save base64 to database
- Subsequent requests: Return cached image instantly (no credits used)

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
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[ImageCache] Failed to create Supabase client: {e}")


def normalize_exercise_name(name: str) -> str:
    """Normalize exercise name for consistent cache lookups"""
    normalized = (name.lower()
            .strip()
            .replace('-', ' ')
            .replace('_', ' ')
            .replace('  ', ' '))
    
    # Remove common plurals for consistency
    # e.g., "push ups" -> "push up", "jumping jacks" stays as is
    if normalized.endswith('s') and not normalized.endswith('ss'):
        # Check if removing 's' gives a common exercise pattern
        singular = normalized[:-1]
        # Keep "jumping jacks", "arm circles" etc as-is (they're proper names)
        if singular not in ['jumping jack', 'high knee', 'arm circle', 'hip circle', 
                           'butt kick', 'leg swing', 'flutter kick', 'mountain climber']:
            # For others like "push ups" -> "push up", "crunches" -> "crunch"
            if normalized in ['push ups', 'crunches', 'lunges', 'squats', 'planks', 
                             'deadlifts', 'curls', 'rows', 'dips', 'raises']:
                normalized = singular
    
    return normalized


async def get_cached_image(exercise_name: str, gender: str = 'neutral') -> Optional[str]:
    """
    Get cached image (base64) for an exercise.
    Returns None if not cached.
    Uses fuzzy matching to find similar exercise names.
    """
    if not supabase:
        print("[ImageCache] No Supabase client")
        return None
    
    normalized = normalize_exercise_name(exercise_name)
    
    try:
        # First try exact match
        result = supabase.table('exercise_image_cache').select('image_url').eq(
            'exercise_name_normalized', normalized
        ).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]['image_url']
        
        # Try partial/fuzzy match - find exercises that contain our search term
        # or that our search term contains
        result = supabase.table('exercise_image_cache').select(
            'exercise_name_normalized, image_url'
        ).ilike('exercise_name_normalized', f'%{normalized}%').execute()
        
        if result.data and len(result.data) > 0:
            # Return the first match
            print(f"[ImageCache] Fuzzy match: '{exercise_name}' -> '{result.data[0]['exercise_name_normalized']}'")
            return result.data[0]['image_url']
        
        # Try the other direction - our term contains a cached exercise name
        # Get all cached names and check
        all_cached = supabase.table('exercise_image_cache').select(
            'exercise_name_normalized, image_url'
        ).execute()
        
        for cached in all_cached.data or []:
            cached_name = cached['exercise_name_normalized']
            if cached_name in normalized or normalized in cached_name:
                print(f"[ImageCache] Reverse fuzzy match: '{exercise_name}' -> '{cached_name}'")
                return cached['image_url']
                
    except Exception as e:
        print(f"[ImageCache] Error checking cache: {e}")
    
    return None


async def save_to_cache(exercise_name: str, image_base64: str, gender: str = 'neutral') -> bool:
    """
    Save an image (as base64 data URL) to the cache.
    """
    if not supabase:
        return False
    
    normalized = normalize_exercise_name(exercise_name)
    
    # Create a data URL for the base64 image
    image_url = f"data:image/png;base64,{image_base64}"
    
    try:
        supabase.table('exercise_image_cache').upsert({
            'exercise_name': exercise_name,
            'exercise_name_normalized': normalized,
            'image_url': image_url,
            'gender': gender,
        }, on_conflict='exercise_name_normalized').execute()
        print(f"[ImageCache] Saved to cache: {exercise_name}")
        return True
    except Exception as e:
        print(f"[ImageCache] Error saving to cache: {e}")
        return False


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
        
        print(f"[ImageCache] Generating image for: {exercise_name}")
        result = await generate_workout_image(
            exercise_name=exercise_name,
            gender=gender,
            muscle_group=muscle_group
        )
        
        if result.get('image_base64'):
            # Save to cache as base64 data URL
            await save_to_cache(exercise_name, result['image_base64'], gender)
            
            return {
                "exercise_name": exercise_name,
                "image_url": f"data:image/png;base64,{result['image_base64']}",
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
