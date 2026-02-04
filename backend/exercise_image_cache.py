"""
Exercise Image Cache Service - OPTIMIZED FOR LOW DISK IO

Uses Supabase Storage for images instead of storing base64 in the database.
This dramatically reduces database disk IO:
- Database only stores small URL strings (~100 bytes) instead of ~2-3MB base64
- Images served directly from Supabase Storage CDN
- Cache lookups are tiny, fast queries

Flow:
1. Check database for cached URL (tiny query)
2. If found, return Storage URL directly
3. If not found, generate image, upload to Storage, save URL to database
"""

import os
import base64
import uuid
from typing import Optional, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')
STORAGE_BUCKET = 'exercise-images'  # Supabase Storage bucket name

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
    if normalized.endswith('s') and not normalized.endswith('ss'):
        singular = normalized[:-1]
        if singular not in ['jumping jack', 'high knee', 'arm circle', 'hip circle', 
                           'butt kick', 'leg swing', 'flutter kick', 'mountain climber']:
            if normalized in ['push ups', 'crunches', 'lunges', 'squats', 'planks', 
                             'deadlifts', 'curls', 'rows', 'dips', 'raises']:
                normalized = singular
    
    return normalized


def get_storage_url(file_path: str) -> str:
    """Generate public URL for a file in Supabase Storage"""
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{file_path}"


async def ensure_storage_bucket_exists():
    """Create the storage bucket if it doesn't exist"""
    if not supabase:
        return False
    
    try:
        # Try to get bucket info - if it fails, create it
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        
        if STORAGE_BUCKET not in bucket_names:
            print(f"[ImageCache] Creating storage bucket: {STORAGE_BUCKET}")
            supabase.storage.create_bucket(
                STORAGE_BUCKET,
                options={"public": True}  # Make bucket public for direct URL access
            )
            print(f"[ImageCache] Storage bucket created successfully")
        return True
    except Exception as e:
        print(f"[ImageCache] Error with storage bucket: {e}")
        return False


async def upload_image_to_storage(exercise_name: str, image_base64: str) -> Optional[str]:
    """
    Upload an image to Supabase Storage and return the public URL.
    
    Returns:
        Public URL of the uploaded image, or None if upload failed
    """
    if not supabase:
        return None
    
    try:
        # Ensure bucket exists
        await ensure_storage_bucket_exists()
        
        # Create a safe filename from exercise name
        safe_name = normalize_exercise_name(exercise_name).replace(' ', '_')
        file_name = f"{safe_name}_{uuid.uuid4().hex[:8]}.png"
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(image_base64)
        
        # Upload to Storage
        result = supabase.storage.from_(STORAGE_BUCKET).upload(
            file_name,
            image_bytes,
            {"content-type": "image/png"}
        )
        
        # Generate public URL
        public_url = get_storage_url(file_name)
        print(f"[ImageCache] Uploaded to Storage: {public_url}")
        
        return public_url
        
    except Exception as e:
        print(f"[ImageCache] Error uploading to storage: {e}")
        return None


async def get_cached_image(exercise_name: str, gender: str = 'neutral') -> Optional[str]:
    """
    Get cached image URL for an exercise.
    Returns Storage URL (not base64) - very fast, minimal IO.
    """
    if not supabase:
        print("[ImageCache] No Supabase client")
        return None
    
    normalized = normalize_exercise_name(exercise_name)
    
    try:
        # OPTIMIZED: Only select the URL column, not the whole row
        result = supabase.table('exercise_image_cache').select('image_url').eq(
            'exercise_name_normalized', normalized
        ).limit(1).execute()
        
        if result.data and len(result.data) > 0:
            url = result.data[0]['image_url']
            # Skip base64 data URLs - they're from the old system
            if url and not url.startswith('data:'):
                return url
        
        # Try pattern match for similar names
        result = supabase.table('exercise_image_cache').select(
            'exercise_name_normalized, image_url'
        ).ilike('exercise_name_normalized', f'%{normalized}%').limit(1).execute()
        
        if result.data and len(result.data) > 0:
            url = result.data[0]['image_url']
            if url and not url.startswith('data:'):
                print(f"[ImageCache] Pattern match: '{exercise_name}' -> '{result.data[0]['exercise_name_normalized']}'")
                return url
        
        # Try without first word for compound exercises
        words = normalized.split()
        if len(words) > 1:
            shorter_name = ' '.join(words[1:])
            result = supabase.table('exercise_image_cache').select(
                'exercise_name_normalized, image_url'
            ).ilike('exercise_name_normalized', f'%{shorter_name}%').limit(1).execute()
            
            if result.data and len(result.data) > 0:
                url = result.data[0]['image_url']
                if url and not url.startswith('data:'):
                    print(f"[ImageCache] Short match: '{exercise_name}' -> '{result.data[0]['exercise_name_normalized']}'")
                    return url
                
    except Exception as e:
        print(f"[ImageCache] Error checking cache: {e}")
    
    return None


async def save_to_cache(exercise_name: str, storage_url: str, gender: str = 'neutral') -> bool:
    """
    Save a Storage URL reference to the cache.
    Only stores the URL string - very small, minimal IO.
    """
    if not supabase:
        return False
    
    normalized = normalize_exercise_name(exercise_name)
    
    try:
        supabase.table('exercise_image_cache').upsert({
            'exercise_name': exercise_name,
            'exercise_name_normalized': normalized,
            'image_url': storage_url,  # Now a real URL, not base64!
            'gender': gender,
        }, on_conflict='exercise_name_normalized').execute()
        print(f"[ImageCache] Saved URL to cache: {exercise_name}")
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
    
    Now returns Storage URLs instead of base64 - much more efficient!
    """
    # Check cache first (fast, minimal IO)
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
            # Upload to Storage instead of storing base64 in database
            storage_url = await upload_image_to_storage(exercise_name, result['image_base64'])
            
            if storage_url:
                # Save the URL reference (tiny database write)
                await save_to_cache(exercise_name, storage_url, gender)
                
                return {
                    "exercise_name": exercise_name,
                    "image_url": storage_url,
                    "cached": False,
                    "generated": True
                }
            else:
                # Fallback to base64 if storage upload fails
                return {
                    "exercise_name": exercise_name,
                    "image_url": f"data:image/png;base64,{result['image_base64']}",
                    "cached": False,
                    "generated": True,
                    "storage_fallback": True
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


async def migrate_base64_to_storage() -> Dict[str, Any]:
    """
    Utility function to migrate existing base64 images to Storage.
    Call this once to convert old data.
    
    Returns migration stats.
    """
    if not supabase:
        return {"error": "No Supabase client"}
    
    stats = {"total": 0, "migrated": 0, "skipped": 0, "errors": 0}
    
    try:
        # Get all cached images
        result = supabase.table('exercise_image_cache').select('*').execute()
        stats["total"] = len(result.data)
        
        for row in result.data:
            image_url = row.get('image_url', '')
            
            # Skip if already a Storage URL
            if not image_url.startswith('data:'):
                stats["skipped"] += 1
                continue
            
            try:
                # Extract base64 from data URL
                base64_data = image_url.split(',')[1] if ',' in image_url else image_url
                
                # Upload to Storage
                storage_url = await upload_image_to_storage(row['exercise_name'], base64_data)
                
                if storage_url:
                    # Update the database record with the new URL
                    supabase.table('exercise_image_cache').update({
                        'image_url': storage_url
                    }).eq('id', row['id']).execute()
                    
                    stats["migrated"] += 1
                    print(f"[Migration] Migrated: {row['exercise_name']}")
                else:
                    stats["errors"] += 1
                    
            except Exception as e:
                print(f"[Migration] Error migrating {row['exercise_name']}: {e}")
                stats["errors"] += 1
                
    except Exception as e:
        return {"error": str(e)}
    
    return stats
