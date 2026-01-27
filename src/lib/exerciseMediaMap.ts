export interface ExerciseMediaInfo {
  image_url: string;
  video_url_optional: string | null;
  default_cues: string[];
}

/**
 * Normalize exercise name for consistent lookup
 * - lowercase
 * - trim whitespace
 * - remove extra spaces
 * - handle common variations (db = dumbbell, bb = barbell, etc.)
 */
export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^db\s+/i, 'dumbbell ')
    .replace(/^bb\s+/i, 'barbell ')
    .replace(/^kb\s+/i, 'kettlebell ');
}

/**
 * Get the public URL for an exercise media file
 * Uses local public folder for now, can be updated to use Supabase storage
 */
function getExerciseMediaUrl(filename: string): string {
  // Use local public folder
  return `/exercise-media/${filename}`;
}

/**
 * Central exercise media map
 * Key: normalized exercise name
 * Value: media info with image, video, and default coaching cues
 */
const exerciseMediaMapData: Record<string, Omit<ExerciseMediaInfo, 'image_url'> & { filename: string }> = {
  // Upper Body - Push
  'dumbbell standing overhead press': {
    filename: 'db-overhead-press.png',
    video_url_optional: null,
    default_cues: [
      'Brace your core',
      'Press straight overhead',
      'Do not arch lower back',
    ],
  },
  'dumbbell bench press': {
    filename: 'db-bench-press.png',
    video_url_optional: null,
    default_cues: [
      'Keep shoulder blades squeezed together',
      'Lower with control to chest level',
      'Press up and slightly in',
    ],
  },
  'push-up': {
    filename: 'push-up.png',
    video_url_optional: null,
    default_cues: [
      'Keep body in a straight line',
      'Elbows at 45-degree angle',
      'Full range of motion',
    ],
  },
  'pushup': {
    filename: 'push-up.png',
    video_url_optional: null,
    default_cues: [
      'Keep body in a straight line',
      'Elbows at 45-degree angle',
      'Full range of motion',
    ],
  },

  // Upper Body - Pull
  'dumbbell row': {
    filename: 'db-row.png',
    video_url_optional: null,
    default_cues: [
      'Keep back flat and core tight',
      'Pull elbow toward hip',
      'Squeeze shoulder blade at top',
    ],
  },
  'dumbbell bent over row': {
    filename: 'db-row.png',
    video_url_optional: null,
    default_cues: [
      'Hinge at hips with flat back',
      'Pull elbows past torso',
      'Control the lowering phase',
    ],
  },
  'lat pulldown': {
    filename: 'lat-pulldown.png',
    video_url_optional: null,
    default_cues: [
      'Lead with your elbows',
      'Pull to upper chest',
      'Squeeze lats at bottom',
    ],
  },

  // Lower Body
  'goblet squat': {
    filename: 'goblet-squat.png',
    video_url_optional: null,
    default_cues: [
      'Keep chest tall',
      'Sit between your hips',
      'Drive through heels',
    ],
  },
  'dumbbell goblet squat': {
    filename: 'goblet-squat.png',
    video_url_optional: null,
    default_cues: [
      'Hold weight at chest height',
      'Elbows inside knees at bottom',
      'Stand tall at the top',
    ],
  },
  'romanian deadlift': {
    filename: 'romanian-deadlift.png',
    video_url_optional: null,
    default_cues: [
      'Maintain slight knee bend',
      'Push hips back, not down',
      'Feel stretch in hamstrings',
    ],
  },
  'dumbbell romanian deadlift': {
    filename: 'romanian-deadlift.png',
    video_url_optional: null,
    default_cues: [
      'Keep dumbbells close to legs',
      'Hinge until tension in hamstrings',
      'Squeeze glutes to stand',
    ],
  },
  'lunge': {
    filename: 'lunge.png',
    video_url_optional: null,
    default_cues: [
      'Take a long stride',
      'Lower back knee toward floor',
      'Keep torso upright',
    ],
  },
  'reverse lunge': {
    filename: 'lunge.png',
    video_url_optional: null,
    default_cues: [
      'Step backward with control',
      'Front knee tracks over toes',
      'Push through front heel to stand',
    ],
  },
  'split squat': {
    filename: 'lunge.png',
    video_url_optional: null,
    default_cues: [
      'Keep front shin vertical',
      'Lower straight down',
      'Maintain balance throughout',
    ],
  },

  // Core
  'plank': {
    filename: 'plank.png',
    video_url_optional: null,
    default_cues: [
      'Straight line from head to heels',
      'Squeeze glutes and abs',
      'Breathe steadily',
    ],
  },
  'dead bug': {
    filename: 'dead-bug.png',
    video_url_optional: null,
    default_cues: [
      'Press lower back into floor',
      'Move opposite arm and leg',
      'Exhale as you extend',
    ],
  },
  'bird dog': {
    filename: 'bird-dog.png',
    video_url_optional: null,
    default_cues: [
      'Extend opposite arm and leg',
      'Keep hips level',
      'Move slowly with control',
    ],
  },

  // Warmup / Mobility
  'arm circles': {
    filename: 'arm-circles.png',
    video_url_optional: null,
    default_cues: [
      'Keep arms straight',
      'Start with small circles',
      'Gradually increase range',
    ],
  },
  'hip circles': {
    filename: 'hip-circles.png',
    video_url_optional: null,
    default_cues: [
      'Stand on one leg',
      'Draw circles with knee',
      'Keep core stable',
    ],
  },
  'leg swings': {
    filename: 'leg-swings.png',
    video_url_optional: null,
    default_cues: [
      'Hold onto something for balance',
      'Swing leg forward and back',
      'Keep leg relatively straight',
    ],
  },
  'world\'s greatest stretch': {
    filename: 'worlds-greatest-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Lunge position with hands down',
      'Rotate torso and reach up',
      'Feel the full body stretch',
    ],
  },
  'cat cow': {
    filename: 'cat-cow.png',
    video_url_optional: null,
    default_cues: [
      'Arch and round your spine',
      'Move with your breath',
      'Feel each vertebra move',
    ],
  },
  'child\'s pose': {
    filename: 'childs-pose.png',
    video_url_optional: null,
    default_cues: [
      'Sit back on heels',
      'Reach arms forward',
      'Relax and breathe deeply',
    ],
  },

  // Conditioning
  'jumping jacks': {
    filename: 'jumping-jacks.png',
    video_url_optional: null,
    default_cues: [
      'Land softly',
      'Keep core engaged',
      'Maintain steady rhythm',
    ],
  },
  'mountain climbers': {
    filename: 'mountain-climbers.png',
    video_url_optional: null,
    default_cues: [
      'Keep hips down',
      'Drive knees toward chest',
      'Maintain plank position',
    ],
  },
  'burpees': {
    filename: 'burpees.png',
    video_url_optional: null,
    default_cues: [
      'Squat, jump back, push-up',
      'Jump feet to hands',
      'Explode up with arms overhead',
    ],
  },
  'high knees': {
    filename: 'high-knees.png',
    video_url_optional: null,
    default_cues: [
      'Drive knees to hip height',
      'Pump arms',
      'Stay light on your feet',
    ],
  },
};

/**
 * Build the full media map with resolved URLs
 */
let resolvedMediaMap: Record<string, ExerciseMediaInfo> | null = null;

export function getExerciseMediaMap(): Record<string, ExerciseMediaInfo> {
  if (resolvedMediaMap) {
    return resolvedMediaMap;
  }

  resolvedMediaMap = {};
  
  for (const [key, value] of Object.entries(exerciseMediaMapData)) {
    resolvedMediaMap[key] = {
      image_url: getExerciseMediaUrl(value.filename),
      video_url_optional: value.video_url_optional,
      default_cues: value.default_cues,
    };
  }

  return resolvedMediaMap;
}

/**
 * Look up exercise media by name
 * Returns null if not found
 */
export function lookupExerciseMedia(exerciseName: string): ExerciseMediaInfo | null {
  const normalized = normalizeExerciseName(exerciseName);
  const mediaMap = getExerciseMediaMap();
  
  // Direct lookup
  if (mediaMap[normalized]) {
    return mediaMap[normalized];
  }

  // Try partial matching for variations
  for (const [key, value] of Object.entries(mediaMap)) {
    // Check if the exercise name contains the key or vice versa
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return null;
}

/**
 * Get default cues for an exercise
 * Returns empty array if not found
 */
export function getDefaultCues(exerciseName: string): string[] {
  const media = lookupExerciseMedia(exerciseName);
  return media?.default_cues || [];
}
