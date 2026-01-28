/**
 * Exercise Media Data
 * 
 * Central repository of exercise demonstration assets and form tips.
 * Organized by category for maintainability.
 * Supports gender-specific demo images.
 */

export type UserGender = 'male' | 'female' | 'unspecified' | null;

export interface GenderDemoImages {
  male: string | null;
  female: string | null;
  neutral?: string;
}

export interface ExerciseMediaEntry {
  /** @deprecated Use demoImages for gender-specific assets */
  filename: string;
  /** Gender-specific demo images */
  demoImages?: GenderDemoImages;
  video_url_optional: string | null;
  default_cues: string[];
}

/**
 * WARMUP EXERCISES
 */
export const warmupExercises: Record<string, ExerciseMediaEntry> = {
  'jog in place': {
    filename: 'jog-in-place.png',
    video_url_optional: null,
    default_cues: [
      'Stay light on your feet',
      'Pump your arms naturally',
      'Keep core engaged',
    ],
  },
  'jumping jacks': {
    filename: 'jumping-jacks.png',
    demoImages: {
      male: 'male/jumping-jacks.png',
      female: 'female/jumping-jacks.png',
      neutral: 'jumping-jacks.png',
    },
    video_url_optional: null,
    default_cues: [
      'Land softly on balls of feet',
      'Keep core engaged throughout',
      'Maintain steady breathing rhythm',
    ],
  },
  'high knees': {
    filename: 'high-knees.png',
    demoImages: {
      male: 'male/high-knees.png',
      female: 'female/high-knees.png',
      neutral: 'high-knees.png',
    },
    video_url_optional: null,
    default_cues: [
      'Drive knees to hip height',
      'Pump arms opposite to legs',
      'Stay light on your feet',
    ],
  },
  'butt kicks': {
    filename: 'butt-kicks.png',
    video_url_optional: null,
    default_cues: [
      'Kick heels toward glutes',
      'Keep torso upright',
      'Maintain quick tempo',
    ],
  },
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
      'Stand on one leg for balance',
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
  'lateral leg swings': {
    filename: 'lateral-leg-swings.png',
    video_url_optional: null,
    default_cues: [
      'Swing leg side to side',
      'Keep hips facing forward',
      'Control the movement',
    ],
  },
  'torso twists': {
    filename: 'torso-twists.png',
    video_url_optional: null,
    default_cues: [
      'Keep hips stable',
      'Rotate from the waist',
      'Let arms swing naturally',
    ],
  },
  'neck rolls': {
    filename: 'neck-rolls.png',
    video_url_optional: null,
    default_cues: [
      'Move slowly and gently',
      'Avoid forcing the stretch',
      'Breathe naturally',
    ],
  },
  'shoulder rolls': {
    filename: 'shoulder-rolls.png',
    video_url_optional: null,
    default_cues: [
      'Roll forward then backward',
      'Lift shoulders to ears, then down',
      'Keep movements smooth',
    ],
  },
  'wrist circles': {
    filename: 'wrist-circles.png',
    video_url_optional: null,
    default_cues: [
      'Circle in both directions',
      'Keep movements controlled',
      'Extend fingers occasionally',
    ],
  },
  'ankle circles': {
    filename: 'ankle-circles.png',
    video_url_optional: null,
    default_cues: [
      'Circle in both directions',
      'Keep leg stable',
      'Full range of motion',
    ],
  },
  'march in place': {
    filename: 'march-in-place.png',
    video_url_optional: null,
    default_cues: [
      'Lift knees to hip height',
      'Pump arms naturally',
      'Keep core engaged',
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
  'inchworm': {
    filename: 'inchworm.png',
    video_url_optional: null,
    default_cues: [
      'Walk hands out to plank',
      'Keep legs as straight as possible',
      'Walk feet back to hands',
    ],
  },
};

/**
 * LOWER BODY EXERCISES
 */
export const lowerBodyExercises: Record<string, ExerciseMediaEntry> = {
  // Squats
  'squat': {
    filename: 'squat.png',
    demoImages: {
      male: 'male/squat.png',
      female: 'female/squat.png',
      neutral: 'squat.png',
    },
    video_url_optional: null,
    default_cues: [
      'Keep chest up and back flat',
      'Push knees out over toes',
      'Drive through heels to stand',
    ],
  },
  'bodyweight squat': {
    filename: 'squat.png',
    demoImages: {
      male: 'male/squat.png',
      female: 'female/squat.png',
      neutral: 'squat.png',
    },
    video_url_optional: null,
    default_cues: [
      'Sit back like into a chair',
      'Keep weight on heels',
      'Thighs parallel or below',
    ],
  },
  'goblet squat': {
    filename: 'goblet-squat.png',
    demoImages: {
      male: 'male/goblet-squat.png',
      female: 'female/goblet-squat.png',
      neutral: 'goblet-squat.png',
    },
    video_url_optional: null,
    default_cues: [
      'Keep chest tall',
      'Sit between your hips',
      'Drive through heels',
    ],
  },
  'dumbbell goblet squat': {
    filename: 'goblet-squat.png',
    demoImages: {
      male: 'male/goblet-squat.png',
      female: 'female/goblet-squat.png',
      neutral: 'goblet-squat.png',
    },
    video_url_optional: null,
    default_cues: [
      'Hold weight at chest height',
      'Elbows inside knees at bottom',
      'Stand tall at the top',
    ],
  },
  'sumo squat': {
    filename: 'sumo-squat.png',
    demoImages: {
      male: 'male/sumo-squat.png',
      female: 'female/sumo-squat.png',
      neutral: 'sumo-squat.png',
    },
    video_url_optional: null,
    default_cues: [
      'Wide stance, toes pointed out',
      'Lower straight down',
      'Keep knees tracking over toes',
    ],
  },
  'split squat': {
    filename: 'lunge.png',
    demoImages: {
      male: 'male/lunge.png',
      female: 'female/lunge.png',
      neutral: 'lunge.png',
    },
    video_url_optional: null,
    default_cues: [
      'Keep front shin vertical',
      'Lower straight down',
      'Maintain balance throughout',
    ],
  },
  'bulgarian split squat': {
    filename: 'bulgarian-split-squat.png',
    demoImages: {
      male: 'male/bulgarian-split-squat.png',
      female: 'female/bulgarian-split-squat.png',
      neutral: 'bulgarian-split-squat.png',
    },
    video_url_optional: null,
    default_cues: [
      'Back foot elevated on bench',
      'Lower until back knee nearly touches floor',
      'Keep torso upright',
    ],
  },

  // Lunges
  'lunge': {
    filename: 'lunge.png',
    demoImages: {
      male: 'male/lunge.png',
      female: 'female/lunge.png',
      neutral: 'lunge.png',
    },
    video_url_optional: null,
    default_cues: [
      'Take a long stride',
      'Lower back knee toward floor',
      'Keep torso upright',
    ],
  },
  'forward lunge': {
    filename: 'lunge.png',
    video_url_optional: null,
    default_cues: [
      'Step forward with control',
      'Lower back knee toward ground',
      'Push through front heel to return',
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
  'walking lunge': {
    filename: 'walking-lunge.png',
    video_url_optional: null,
    default_cues: [
      'Take alternating steps forward',
      'Maintain upright posture',
      'Control each step',
    ],
  },
  'lateral lunge': {
    filename: 'lateral-lunge.png',
    video_url_optional: null,
    default_cues: [
      'Step wide to the side',
      'Sit back into the working hip',
      'Keep other leg straight',
    ],
  },
  'curtsy lunge': {
    filename: 'curtsy-lunge.png',
    video_url_optional: null,
    default_cues: [
      'Step back and across',
      'Keep hips facing forward',
      'Lower with control',
    ],
  },

  // Hip Hinge
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
  'single leg romanian deadlift': {
    filename: 'single-leg-rdl.png',
    video_url_optional: null,
    default_cues: [
      'Balance on one leg',
      'Hinge at hip while extending back leg',
      'Keep hips square to floor',
    ],
  },
  'good morning': {
    filename: 'good-morning.png',
    video_url_optional: null,
    default_cues: [
      'Slight knee bend',
      'Hinge at hips with flat back',
      'Feel hamstring stretch',
    ],
  },
  'hip hinge': {
    filename: 'hip-hinge.png',
    video_url_optional: null,
    default_cues: [
      'Push hips back',
      'Keep spine neutral',
      'Bend at hips not waist',
    ],
  },

  // Glutes
  'glute bridge': {
    filename: 'glute-bridge.png',
    video_url_optional: null,
    default_cues: [
      'Press through heels',
      'Squeeze glutes at the top',
      'Keep core engaged',
    ],
  },
  'single leg glute bridge': {
    filename: 'single-leg-glute-bridge.png',
    video_url_optional: null,
    default_cues: [
      'One leg extended or bent',
      'Press through working heel',
      'Keep hips level',
    ],
  },
  'hip thrust': {
    filename: 'hip-thrust.png',
    video_url_optional: null,
    default_cues: [
      'Upper back on bench',
      'Drive hips to ceiling',
      'Squeeze glutes hard at top',
    ],
  },
  'clamshell': {
    filename: 'clamshell.png',
    video_url_optional: null,
    default_cues: [
      'Lie on side with knees bent',
      'Keep feet together',
      'Lift top knee using glute',
    ],
  },
  'fire hydrant': {
    filename: 'fire-hydrant.png',
    video_url_optional: null,
    default_cues: [
      'On all fours',
      'Lift knee out to side',
      'Keep core stable',
    ],
  },
  'donkey kick': {
    filename: 'donkey-kick.png',
    video_url_optional: null,
    default_cues: [
      'On all fours',
      'Drive heel toward ceiling',
      'Squeeze glute at top',
    ],
  },

  // Calves
  'calf raise': {
    filename: 'calf-raise.png',
    video_url_optional: null,
    default_cues: [
      'Rise onto balls of feet',
      'Pause at the top',
      'Lower with control',
    ],
  },
  'standing calf raise': {
    filename: 'calf-raise.png',
    video_url_optional: null,
    default_cues: [
      'Stand tall with feet hip-width',
      'Rise as high as possible',
      'Hold briefly at peak',
    ],
  },
  'single leg calf raise': {
    filename: 'single-leg-calf-raise.png',
    video_url_optional: null,
    default_cues: [
      'Balance on one foot',
      'Rise onto ball of foot',
      'Control the lowering',
    ],
  },

  // Step-ups
  'step up': {
    filename: 'step-up.png',
    video_url_optional: null,
    default_cues: [
      'Step onto elevated surface',
      'Drive through front heel',
      'Control the step down',
    ],
  },
  'lateral step up': {
    filename: 'lateral-step-up.png',
    video_url_optional: null,
    default_cues: [
      'Step up from the side',
      'Keep torso upright',
      'Control the descent',
    ],
  },

  // Wall sits
  'wall sit': {
    filename: 'wall-sit.png',
    video_url_optional: null,
    default_cues: [
      'Back flat against wall',
      'Thighs parallel to floor',
      'Hold the position steady',
    ],
  },
};

/**
 * UPPER BODY - PUSH EXERCISES
 */
export const upperBodyPushExercises: Record<string, ExerciseMediaEntry> = {
  // Push-ups
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
  'incline push-up': {
    filename: 'incline-push-up.png',
    video_url_optional: null,
    default_cues: [
      'Hands on elevated surface',
      'Keep body straight',
      'Easier than floor push-up',
    ],
  },
  'decline push-up': {
    filename: 'decline-push-up.png',
    video_url_optional: null,
    default_cues: [
      'Feet elevated on surface',
      'Keep core tight',
      'More challenging than floor',
    ],
  },
  'diamond push-up': {
    filename: 'diamond-push-up.png',
    video_url_optional: null,
    default_cues: [
      'Hands form diamond under chest',
      'Elbows close to body',
      'Targets triceps more',
    ],
  },
  'wide push-up': {
    filename: 'wide-push-up.png',
    video_url_optional: null,
    default_cues: [
      'Hands wider than shoulders',
      'Keep core engaged',
      'Targets chest more',
    ],
  },
  'knee push-up': {
    filename: 'knee-push-up.png',
    video_url_optional: null,
    default_cues: [
      'Knees on ground',
      'Keep line from knees to shoulders',
      'Great for building up strength',
    ],
  },

  // Chest press
  'dumbbell bench press': {
    filename: 'db-bench-press.png',
    video_url_optional: null,
    default_cues: [
      'Keep shoulder blades squeezed together',
      'Lower with control to chest level',
      'Press up and slightly in',
    ],
  },
  'dumbbell chest press': {
    filename: 'db-bench-press.png',
    video_url_optional: null,
    default_cues: [
      'Back flat on bench',
      'Lower weights to chest',
      'Press straight up',
    ],
  },
  'floor press': {
    filename: 'floor-press.png',
    video_url_optional: null,
    default_cues: [
      'Lie on floor with dumbbells',
      'Lower until triceps touch floor',
      'Press back up',
    ],
  },
  'dumbbell fly': {
    filename: 'dumbbell-fly.png',
    video_url_optional: null,
    default_cues: [
      'Slight bend in elbows',
      'Lower arms out to sides',
      'Squeeze chest to bring together',
    ],
  },

  // Shoulder press
  'dumbbell standing overhead press': {
    filename: 'db-overhead-press.png',
    video_url_optional: null,
    default_cues: [
      'Brace your core',
      'Press straight overhead',
      'Do not arch lower back',
    ],
  },
  'dumbbell shoulder press': {
    filename: 'db-overhead-press.png',
    video_url_optional: null,
    default_cues: [
      'Start at shoulder height',
      'Press directly overhead',
      'Lower with control',
    ],
  },
  'seated dumbbell press': {
    filename: 'seated-dumbbell-press.png',
    video_url_optional: null,
    default_cues: [
      'Sit with back supported',
      'Press weights overhead',
      'Keep core engaged',
    ],
  },
  'arnold press': {
    filename: 'arnold-press.png',
    video_url_optional: null,
    default_cues: [
      'Start with palms facing you',
      'Rotate as you press up',
      'Finish with palms forward',
    ],
  },
  'pike push-up': {
    filename: 'pike-push-up.png',
    video_url_optional: null,
    default_cues: [
      'Hips high in pike position',
      'Lower head toward floor',
      'Targets shoulders',
    ],
  },

  // Lateral raises
  'lateral raise': {
    filename: 'lateral-raise.png',
    video_url_optional: null,
    default_cues: [
      'Slight bend in elbows',
      'Raise to shoulder height',
      'Control the lowering',
    ],
  },
  'dumbbell lateral raise': {
    filename: 'lateral-raise.png',
    video_url_optional: null,
    default_cues: [
      'Keep slight elbow bend',
      'Lead with elbows',
      'Don\'t swing the weights',
    ],
  },
  'front raise': {
    filename: 'front-raise.png',
    video_url_optional: null,
    default_cues: [
      'Raise arms in front',
      'Stop at shoulder height',
      'Lower with control',
    ],
  },

  // Triceps
  'triceps extension': {
    filename: 'triceps-extension.png',
    video_url_optional: null,
    default_cues: [
      'Keep upper arms still',
      'Extend forearms fully',
      'Squeeze triceps at top',
    ],
  },
  'overhead triceps extension': {
    filename: 'overhead-triceps-extension.png',
    video_url_optional: null,
    default_cues: [
      'Hold weight overhead',
      'Lower behind head',
      'Keep elbows pointed up',
    ],
  },
  'triceps dip': {
    filename: 'triceps-dip.png',
    video_url_optional: null,
    default_cues: [
      'Hands on bench behind you',
      'Lower body by bending elbows',
      'Press back up',
    ],
  },
  'bench dip': {
    filename: 'bench-dip.png',
    video_url_optional: null,
    default_cues: [
      'Hands on edge of bench',
      'Lower until elbows at 90°',
      'Push back up',
    ],
  },
  'triceps kickback': {
    filename: 'triceps-kickback.png',
    video_url_optional: null,
    default_cues: [
      'Hinge forward at hips',
      'Extend arm straight back',
      'Squeeze tricep at top',
    ],
  },
  'skull crusher': {
    filename: 'skull-crusher.png',
    video_url_optional: null,
    default_cues: [
      'Lie on bench or floor',
      'Lower weights toward forehead',
      'Extend arms back up',
    ],
  },
};

/**
 * UPPER BODY - PULL EXERCISES
 */
export const upperBodyPullExercises: Record<string, ExerciseMediaEntry> = {
  // Rows
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
  'single arm row': {
    filename: 'single-arm-row.png',
    video_url_optional: null,
    default_cues: [
      'One hand on bench for support',
      'Pull weight to hip',
      'Keep back flat',
    ],
  },
  'bent over row': {
    filename: 'bent-over-row.png',
    video_url_optional: null,
    default_cues: [
      'Hinge at hips 45 degrees',
      'Pull to lower chest/upper abs',
      'Squeeze shoulder blades',
    ],
  },
  'renegade row': {
    filename: 'renegade-row.png',
    video_url_optional: null,
    default_cues: [
      'Start in push-up position',
      'Row one weight at a time',
      'Keep hips stable',
    ],
  },
  'inverted row': {
    filename: 'inverted-row.png',
    video_url_optional: null,
    default_cues: [
      'Hang under bar or TRX',
      'Pull chest to bar',
      'Keep body straight',
    ],
  },
  'upright row': {
    filename: 'upright-row.png',
    video_url_optional: null,
    default_cues: [
      'Pull weights to chin height',
      'Keep elbows high',
      'Lower with control',
    ],
  },

  // Lat pulldown / Pull-ups
  'lat pulldown': {
    filename: 'lat-pulldown.png',
    video_url_optional: null,
    default_cues: [
      'Lead with your elbows',
      'Pull to upper chest',
      'Squeeze lats at bottom',
    ],
  },
  'pull-up': {
    filename: 'pull-up.png',
    video_url_optional: null,
    default_cues: [
      'Hang with arms extended',
      'Pull chin over bar',
      'Control the descent',
    ],
  },
  'chin-up': {
    filename: 'chin-up.png',
    video_url_optional: null,
    default_cues: [
      'Underhand grip',
      'Pull chin over bar',
      'Emphasizes biceps more',
    ],
  },

  // Biceps
  'bicep curl': {
    filename: 'bicep-curl.png',
    video_url_optional: null,
    default_cues: [
      'Keep elbows at sides',
      'Curl weights up fully',
      'Lower with control',
    ],
  },
  'dumbbell curl': {
    filename: 'bicep-curl.png',
    video_url_optional: null,
    default_cues: [
      'Stand with arms at sides',
      'Curl with palms up',
      'Don\'t swing the weights',
    ],
  },
  'hammer curl': {
    filename: 'hammer-curl.png',
    video_url_optional: null,
    default_cues: [
      'Palms face each other',
      'Curl up keeping neutral grip',
      'Works forearms too',
    ],
  },
  'concentration curl': {
    filename: 'concentration-curl.png',
    video_url_optional: null,
    default_cues: [
      'Elbow braced against inner thigh',
      'Curl weight toward shoulder',
      'Full contraction at top',
    ],
  },
  'incline curl': {
    filename: 'incline-curl.png',
    video_url_optional: null,
    default_cues: [
      'Sit on incline bench',
      'Arms hang straight down',
      'Curl up with full range',
    ],
  },

  // Rear delts
  'reverse fly': {
    filename: 'reverse-fly.png',
    video_url_optional: null,
    default_cues: [
      'Bend over with flat back',
      'Raise arms out to sides',
      'Squeeze shoulder blades',
    ],
  },
  'rear delt fly': {
    filename: 'rear-delt-fly.png',
    video_url_optional: null,
    default_cues: [
      'Slight bend in elbows',
      'Raise to shoulder height',
      'Focus on rear delts',
    ],
  },
  'face pull': {
    filename: 'face-pull.png',
    video_url_optional: null,
    default_cues: [
      'Pull toward face',
      'Keep elbows high',
      'Squeeze shoulder blades',
    ],
  },

  // Shrugs
  'shrug': {
    filename: 'shrug.png',
    video_url_optional: null,
    default_cues: [
      'Lift shoulders to ears',
      'Hold briefly at top',
      'Lower with control',
    ],
  },
  'dumbbell shrug': {
    filename: 'shrug.png',
    video_url_optional: null,
    default_cues: [
      'Arms at sides holding weights',
      'Shrug shoulders straight up',
      'Don\'t roll shoulders',
    ],
  },
};

/**
 * CORE EXERCISES
 */
export const coreExercises: Record<string, ExerciseMediaEntry> = {
  // Planks
  'plank': {
    filename: 'plank.png',
    video_url_optional: null,
    default_cues: [
      'Straight line from head to heels',
      'Squeeze glutes and abs',
      'Breathe steadily',
    ],
  },
  'forearm plank': {
    filename: 'plank.png',
    video_url_optional: null,
    default_cues: [
      'Elbows under shoulders',
      'Keep body straight',
      'Don\'t let hips sag',
    ],
  },
  'side plank': {
    filename: 'side-plank.png',
    video_url_optional: null,
    default_cues: [
      'Stack feet or stagger',
      'Keep hips lifted',
      'Straight line from head to feet',
    ],
  },
  'high plank': {
    filename: 'high-plank.png',
    video_url_optional: null,
    default_cues: [
      'Arms straight, hands under shoulders',
      'Body in straight line',
      'Engage core throughout',
    ],
  },
  'plank shoulder tap': {
    filename: 'plank-shoulder-tap.png',
    video_url_optional: null,
    default_cues: [
      'Start in high plank',
      'Tap opposite shoulder',
      'Minimize hip rotation',
    ],
  },
  'plank to push-up': {
    filename: 'plank-to-pushup.png',
    video_url_optional: null,
    default_cues: [
      'Start on forearms',
      'Push up to hands one at a time',
      'Return to forearms',
    ],
  },

  // Crunches and Sit-ups
  'crunch': {
    filename: 'crunch.png',
    video_url_optional: null,
    default_cues: [
      'Lift shoulders off ground',
      'Keep lower back pressed down',
      'Don\'t pull on neck',
    ],
  },
  'bicycle crunch': {
    filename: 'bicycle-crunch.png',
    video_url_optional: null,
    default_cues: [
      'Rotate elbow to opposite knee',
      'Extend other leg straight',
      'Keep lower back pressed down',
    ],
  },
  'reverse crunch': {
    filename: 'reverse-crunch.png',
    video_url_optional: null,
    default_cues: [
      'Lift hips off ground',
      'Curl knees toward chest',
      'Lower with control',
    ],
  },
  'sit-up': {
    filename: 'sit-up.png',
    video_url_optional: null,
    default_cues: [
      'Feet anchored or free',
      'Curl all the way up',
      'Control the descent',
    ],
  },
  'v-up': {
    filename: 'v-up.png',
    video_url_optional: null,
    default_cues: [
      'Lift legs and torso together',
      'Reach hands toward feet',
      'Form a V shape',
    ],
  },

  // Dead bugs and Bird dogs
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

  // Leg raises
  'leg raise': {
    filename: 'leg-raise.png',
    video_url_optional: null,
    default_cues: [
      'Keep legs straight or slight bend',
      'Lower until just above ground',
      'Press lower back into floor',
    ],
  },
  'lying leg raise': {
    filename: 'lying-leg-raise.png',
    video_url_optional: null,
    default_cues: [
      'Lie flat on back',
      'Raise legs to 90 degrees',
      'Lower with control',
    ],
  },
  'flutter kick': {
    filename: 'flutter-kick.png',
    video_url_optional: null,
    default_cues: [
      'Small alternating kicks',
      'Keep lower back down',
      'Legs hover above ground',
    ],
  },
  'scissor kick': {
    filename: 'scissor-kick.png',
    video_url_optional: null,
    default_cues: [
      'Cross legs over each other',
      'Keep legs straight',
      'Press lower back down',
    ],
  },

  // Mountain climbers and similar
  'mountain climber': {
    filename: 'mountain-climbers.png',
    video_url_optional: null,
    default_cues: [
      'Keep hips down',
      'Drive knees toward chest',
      'Maintain plank position',
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
  'cross body mountain climber': {
    filename: 'cross-body-mountain-climber.png',
    video_url_optional: null,
    default_cues: [
      'Drive knee toward opposite elbow',
      'Twist at the core',
      'Keep plank position',
    ],
  },

  // Twists
  'russian twist': {
    filename: 'russian-twist.png',
    video_url_optional: null,
    default_cues: [
      'Lean back slightly',
      'Rotate torso side to side',
      'Keep feet elevated',
    ],
  },
  'seated twist': {
    filename: 'seated-twist.png',
    video_url_optional: null,
    default_cues: [
      'Sit with knees bent',
      'Rotate from the waist',
      'Touch floor on each side',
    ],
  },
  'wood chop': {
    filename: 'wood-chop.png',
    video_url_optional: null,
    default_cues: [
      'Start low on one side',
      'Rotate and lift diagonally',
      'Control the movement',
    ],
  },

  // Other core
  'hollow body hold': {
    filename: 'hollow-body-hold.png',
    video_url_optional: null,
    default_cues: [
      'Press lower back into floor',
      'Arms and legs extended',
      'Maintain banana shape',
    ],
  },
  'superman': {
    filename: 'superman.png',
    video_url_optional: null,
    default_cues: [
      'Lie face down',
      'Lift arms and legs off ground',
      'Squeeze lower back',
    ],
  },
  'ab wheel rollout': {
    filename: 'ab-wheel-rollout.png',
    video_url_optional: null,
    default_cues: [
      'Start on knees',
      'Roll out while keeping core tight',
      'Don\'t let hips sag',
    ],
  },
};

/**
 * CONDITIONING / CARDIO EXERCISES
 */
export const conditioningExercises: Record<string, ExerciseMediaEntry> = {
  'burpee': {
    filename: 'burpees.png',
    video_url_optional: null,
    default_cues: [
      'Squat, jump back, push-up',
      'Jump feet to hands',
      'Explode up with arms overhead',
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
  'squat jump': {
    filename: 'squat-jump.png',
    video_url_optional: null,
    default_cues: [
      'Squat down low',
      'Explode up jumping',
      'Land softly back in squat',
    ],
  },
  'jump squat': {
    filename: 'squat-jump.png',
    video_url_optional: null,
    default_cues: [
      'Lower into squat',
      'Jump explosively',
      'Absorb landing softly',
    ],
  },
  'lunge jump': {
    filename: 'lunge-jump.png',
    video_url_optional: null,
    default_cues: [
      'Start in lunge position',
      'Jump and switch legs',
      'Land softly',
    ],
  },
  'jumping lunges': {
    filename: 'jumping-lunges.png',
    video_url_optional: null,
    default_cues: [
      'Alternate legs in air',
      'Land with soft knees',
      'Keep torso upright',
    ],
  },
  'box jump': {
    filename: 'box-jump.png',
    video_url_optional: null,
    default_cues: [
      'Swing arms to generate power',
      'Jump onto box',
      'Step down carefully',
    ],
  },
  'broad jump': {
    filename: 'broad-jump.png',
    video_url_optional: null,
    default_cues: [
      'Swing arms back then forward',
      'Jump as far as possible',
      'Land with soft knees',
    ],
  },
  'skater': {
    filename: 'skater.png',
    video_url_optional: null,
    default_cues: [
      'Jump laterally side to side',
      'Land on one foot',
      'Reach with opposite hand',
    ],
  },
  'skaters': {
    filename: 'skater.png',
    video_url_optional: null,
    default_cues: [
      'Bound side to side',
      'Stay low and athletic',
      'Pump arms for momentum',
    ],
  },
  'tuck jump': {
    filename: 'tuck-jump.png',
    video_url_optional: null,
    default_cues: [
      'Jump and pull knees to chest',
      'Land softly',
      'Immediately jump again',
    ],
  },
  'star jump': {
    filename: 'star-jump.png',
    video_url_optional: null,
    default_cues: [
      'Squat down first',
      'Jump and spread arms and legs',
      'Land softly back together',
    ],
  },
  'speed skater': {
    filename: 'speed-skater.png',
    video_url_optional: null,
    default_cues: [
      'Low lateral bounds',
      'Touch ground with hand',
      'Stay athletic and low',
    ],
  },
  'sprint': {
    filename: 'sprint.png',
    video_url_optional: null,
    default_cues: [
      'Drive arms powerfully',
      'High knee drive',
      'Stay on balls of feet',
    ],
  },
  'shuttle run': {
    filename: 'shuttle-run.png',
    video_url_optional: null,
    default_cues: [
      'Touch line and return',
      'Decelerate before turning',
      'Accelerate quickly',
    ],
  },
  'bear crawl': {
    filename: 'bear-crawl.png',
    video_url_optional: null,
    default_cues: [
      'On hands and feet',
      'Knees hover just above ground',
      'Move opposite hand and foot',
    ],
  },
  'frog jump': {
    filename: 'frog-jump.png',
    video_url_optional: null,
    default_cues: [
      'Deep squat start position',
      'Jump forward like a frog',
      'Land in squat',
    ],
  },
  'battle rope': {
    filename: 'battle-rope.png',
    video_url_optional: null,
    default_cues: [
      'Create waves with alternating arms',
      'Keep core engaged',
      'Maintain athletic stance',
    ],
  },
};

/**
 * MOBILITY & COOLDOWN EXERCISES
 */
export const mobilityExercises: Record<string, ExerciseMediaEntry> = {
  // Stretches
  'quad stretch': {
    filename: 'quad-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Pull foot toward glute',
      'Keep knees together',
      'Hold for 30+ seconds',
    ],
  },
  'standing quad stretch': {
    filename: 'standing-quad-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Balance on one leg',
      'Pull heel to glute',
      'Keep torso upright',
    ],
  },
  'hamstring stretch': {
    filename: 'hamstring-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Keep leg straight',
      'Hinge at hips toward foot',
      'Feel stretch in back of leg',
    ],
  },
  'standing hamstring stretch': {
    filename: 'standing-hamstring-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Place heel on elevated surface',
      'Keep leg straight',
      'Lean forward from hips',
    ],
  },
  'seated hamstring stretch': {
    filename: 'seated-hamstring-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Sit with one leg extended',
      'Reach toward toes',
      'Keep back flat',
    ],
  },
  'hip flexor stretch': {
    filename: 'hip-flexor-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Half-kneeling position',
      'Push hips forward gently',
      'Keep torso upright',
    ],
  },
  'kneeling hip flexor stretch': {
    filename: 'kneeling-hip-flexor-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Back knee on ground',
      'Front knee at 90 degrees',
      'Lean forward slightly',
    ],
  },
  'pigeon pose': {
    filename: 'pigeon-pose.png',
    video_url_optional: null,
    default_cues: [
      'Front shin across body',
      'Back leg extended behind',
      'Fold forward to deepen',
    ],
  },
  'figure four stretch': {
    filename: 'figure-four-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Cross ankle over opposite knee',
      'Pull legs toward chest',
      'Feel stretch in hip',
    ],
  },
  'seated glute stretch': {
    filename: 'seated-glute-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Cross one leg over other',
      'Hug knee toward chest',
      'Sit tall',
    ],
  },
  'calf stretch': {
    filename: 'calf-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Step one foot back',
      'Press heel into ground',
      'Lean into wall or support',
    ],
  },
  'standing calf stretch': {
    filename: 'standing-calf-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Lean against wall',
      'Back leg straight',
      'Press heel down',
    ],
  },
  'chest stretch': {
    filename: 'chest-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Hand on wall or doorframe',
      'Turn body away',
      'Feel stretch in chest',
    ],
  },
  'doorway chest stretch': {
    filename: 'doorway-chest-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Forearm on door frame',
      'Step through doorway',
      'Open up chest',
    ],
  },
  'shoulder stretch': {
    filename: 'shoulder-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Pull arm across body',
      'Use other hand to deepen',
      'Relax shoulder down',
    ],
  },
  'cross body shoulder stretch': {
    filename: 'cross-body-shoulder-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Arm across chest',
      'Pull with opposite hand',
      'Keep shoulder down',
    ],
  },
  'triceps stretch': {
    filename: 'triceps-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Reach hand behind head',
      'Use other hand to pull elbow',
      'Keep elbow pointed up',
    ],
  },
  'overhead triceps stretch': {
    filename: 'overhead-triceps-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Reach behind head',
      'Touch opposite shoulder blade',
      'Gently pull elbow',
    ],
  },
  'lat stretch': {
    filename: 'lat-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Reach arm overhead',
      'Lean to opposite side',
      'Feel stretch along side',
    ],
  },
  'standing side stretch': {
    filename: 'standing-side-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Reach arm overhead',
      'Lean to one side',
      'Keep hips centered',
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
  'cobra stretch': {
    filename: 'cobra-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Lie face down',
      'Press chest up with arms',
      'Keep hips on ground',
    ],
  },
  'upward dog': {
    filename: 'upward-dog.png',
    video_url_optional: null,
    default_cues: [
      'Arms straight, chest lifted',
      'Thighs off ground',
      'Open up front body',
    ],
  },
  'downward dog': {
    filename: 'downward-dog.png',
    video_url_optional: null,
    default_cues: [
      'Hips high, heels toward ground',
      'Arms and legs straight',
      'Push through palms',
    ],
  },
  'spinal twist': {
    filename: 'spinal-twist.png',
    video_url_optional: null,
    default_cues: [
      'Lie on back',
      'Drop knees to one side',
      'Keep shoulders on floor',
    ],
  },
  'seated spinal twist': {
    filename: 'seated-spinal-twist.png',
    video_url_optional: null,
    default_cues: [
      'Sit with one leg extended',
      'Cross other foot over',
      'Twist toward bent knee',
    ],
  },
  'forward fold': {
    filename: 'forward-fold.png',
    video_url_optional: null,
    default_cues: [
      'Hinge at hips',
      'Let head hang heavy',
      'Slight bend in knees okay',
    ],
  },
  'standing forward fold': {
    filename: 'standing-forward-fold.png',
    video_url_optional: null,
    default_cues: [
      'Fold from hips',
      'Reach toward toes',
      'Relax neck and shoulders',
    ],
  },
  'butterfly stretch': {
    filename: 'butterfly-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Soles of feet together',
      'Let knees drop open',
      'Sit tall or fold forward',
    ],
  },
  'hip 90/90 stretch': {
    filename: 'hip-90-90-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Both legs at 90 degrees',
      'Rotate between internal and external',
      'Keep chest up',
    ],
  },
  'thoracic rotation': {
    filename: 'thoracic-rotation.png',
    video_url_optional: null,
    default_cues: [
      'On all fours or side-lying',
      'Rotate upper back',
      'Follow hand with eyes',
    ],
  },
  'thread the needle': {
    filename: 'thread-the-needle.png',
    video_url_optional: null,
    default_cues: [
      'Start on all fours',
      'Reach one arm under body',
      'Rotate through spine',
    ],
  },
  'scorpion stretch': {
    filename: 'scorpion-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Lie face down',
      'Reach foot toward opposite hand',
      'Feel hip and back stretch',
    ],
  },
  'deep breathing': {
    filename: 'deep-breathing.png',
    video_url_optional: null,
    default_cues: [
      'Inhale deeply through nose',
      'Expand belly then chest',
      'Exhale slowly through mouth',
    ],
  },
  'full body stretch': {
    filename: 'full-body-stretch.png',
    video_url_optional: null,
    default_cues: [
      'Lie on back',
      'Reach arms overhead, point toes',
      'Stretch from fingers to toes',
    ],
  },
};

/**
 * Combine all categories into a single map
 */
export const allExerciseMediaData: Record<string, ExerciseMediaEntry> = {
  ...warmupExercises,
  ...lowerBodyExercises,
  ...upperBodyPushExercises,
  ...upperBodyPullExercises,
  ...coreExercises,
  ...conditioningExercises,
  ...mobilityExercises,
};
