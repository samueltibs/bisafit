/**
 * Translation strings for all supported languages
 * 
 * Supported language codes:
 * - en: English (canonical - all keys must exist here)
 * - es: Spanish
 * - pt: Portuguese
 * - fr: French
 * - zh: Chinese (Simplified)
 * - ja: Japanese
 * - ru: Russian
 * - de: German
 * - nl: Dutch
 * - it: Italian
 * - sw: Swahili
 * - af: Afrikaans
 * - lg: Luganda
 * 
 * All strings must be complete - no partial translations allowed.
 * Missing translations fall back to English.
 * 
 * To add a new language:
 * 1. Add the language to SUPPORTED_LANGUAGES in src/lib/languageUtils.ts
 * 2. Create a translation record here (can start as copy of `en`)
 * 3. Add to the translations map at the bottom
 */

export type TranslationKey = keyof typeof en;

// English translations (canonical - all keys must exist here)
export const en = {
  // Common
  'common.loading': 'Loading...',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.done': 'Done',
  'common.next': 'Next',
  'common.back': 'Back',
  'common.skip': 'Skip',
  'common.continue': 'Continue',
  'common.submit': 'Submit',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.close': 'Close',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.optional': 'optional',
  'common.required': 'required',
  
  // Navigation
  'nav.home': 'Home',
  'nav.plan': 'Plan',
  'nav.workout': 'Workout',
  'nav.nutrition': 'Nutrition',
  'nav.progress': 'Progress',
  'nav.settings': 'Settings',
  'nav.store': 'Store',
  
  // Days of the week
  'day.monday': 'Monday',
  'day.tuesday': 'Tuesday',
  'day.wednesday': 'Wednesday',
  'day.thursday': 'Thursday',
  'day.friday': 'Friday',
  'day.saturday': 'Saturday',
  'day.sunday': 'Sunday',
  'day.mon': 'Mon',
  'day.tue': 'Tue',
  'day.wed': 'Wed',
  'day.thu': 'Thu',
  'day.fri': 'Fri',
  'day.sat': 'Sat',
  'day.sun': 'Sun',
  
  // Workout types
  'workout.type.strength': 'Strength',
  'workout.type.cardio': 'Cardio',
  'workout.type.recovery': 'Recovery',
  'workout.type.core': 'Core',
  'workout.type.rest': 'Rest',
  'workout.type.conditioning': 'Conditioning',
  
  // Workout labels
  'workout.sets': 'Sets',
  'workout.reps': 'Reps',
  'workout.rest': 'Rest',
  'workout.duration': 'Duration',
  'workout.warmup': 'Warm-up',
  'workout.cooldown': 'Cool-down',
  'workout.mainWorkout': 'Main Workout',
  'workout.exercise': 'Exercise',
  'workout.exercises': 'Exercises',
  'workout.complete': 'Complete',
  'workout.skip': 'Skip',
  'workout.startWorkout': 'Start Workout',
  'workout.resumeWorkout': 'Resume Workout',
  'workout.endWorkout': 'End Workout',
  'workout.workoutComplete': 'Workout Complete!',
  'workout.greatJob': 'Great job! You crushed it.',
  'workout.todaysWorkout': "Today's Workout",
  'workout.noWorkoutToday': 'No workout scheduled for today',
  'workout.restDay': 'Rest Day',
  'workout.enjoyRestDay': 'Take it easy and recover.',
  'workout.generic': 'Workout',
  'workout.day': 'Day',
  
  // Workout program names
  'workout.program.foundation': 'Foundation',
  'workout.program.progression': 'Progression',
  'workout.program.peak': 'Peak',
  'workout.program.deload': 'Deload',
  'workout.program.strength': 'Strength',
  'workout.program.conditioning': 'Conditioning',
  'workout.program.mobility': 'Mobility',
  'workout.program.custom': 'Custom',
  
  // Workout focus labels
  'workout.focus.balance': 'Balance',
  'workout.focus.strength': 'Strength',
  'workout.focus.stability': 'Stability',
  'workout.focus.power': 'Power',
  'workout.focus.endurance': 'Endurance',
  'workout.focus.recovery': 'Recovery',
  'workout.focus.mobility': 'Mobility',
  'workout.focus.core': 'Core',
  'workout.focus.upper_body': 'Upper Body',
  'workout.focus.lower_body': 'Lower Body',
  'workout.focus.full_body': 'Full Body',
  'workout.focus.hiit': 'HIIT',
  'workout.focus.cardio': 'Cardio',
  
  // Plan
  'plan.title': 'Your Plan',
  'plan.week': 'Week',
  'plan.block': 'Block',
  'plan.generatePlan': 'Generate My Plan',
  'plan.regeneratePlan': 'Regenerate Plan',
  'plan.buildNextBlock': 'Build My Next Block',
  'plan.currentBlock': 'Current Block',
  'plan.coachNotes': 'Coach Notes',
  'plan.workoutsPerWeek': 'workouts this week',
  'plan.planNotReady': "Your Plan Isn't Ready Yet",
  'plan.generateFirst': 'Generate your first plan to begin your personalized 4-week training journey.',
  'plan.readyForNextBlock': 'Ready for Your Next Block!',
  'plan.currentBlockInProgress': 'Current Block in Progress',
  'plan.workoutsCompleted': 'workouts completed',
  
  // Goals
  'goal.fatLoss': 'Fat Loss',
  'goal.fatLoss.desc': 'Burn fat and get lean',
  'goal.muscleGain': 'Build Muscle',
  'goal.muscleGain.desc': 'Gain strength and size',
  'goal.endurance': 'Endurance',
  'goal.endurance.desc': 'Improve stamina & cardio',
  'goal.maintenance': 'Maintenance',
  'goal.maintenance.desc': 'Maintain current fitness',
  
  // Experience levels
  'experience.beginner': 'Beginner',
  'experience.beginner.desc': 'New to fitness or returning after a break',
  'experience.intermediate': 'Intermediate',
  'experience.intermediate.desc': '1-3 years of consistent training',
  'experience.advanced': 'Advanced',
  'experience.advanced.desc': '3+ years of serious training',
  
  // Gender
  'gender.male': 'Male',
  'gender.female': 'Female',
  'gender.other': 'Other',
  'gender.preferNotToSay': 'Prefer not to say',
  
  // Onboarding
  'onboarding.aboutYou': 'About You',
  'onboarding.aboutYou.desc': "Let's get to know you better",
  'onboarding.yourName': 'Your Name',
  'onboarding.gender': 'Gender',
  'onboarding.height': 'Height',
  'onboarding.weight': 'Weight',
  'onboarding.unitPreference': 'Unit Preference',
  'onboarding.metric': 'Metric (kg, cm)',
  'onboarding.imperial': 'Imperial (lb, in)',
  'onboarding.primaryGoal': "What's your primary goal?",
  'onboarding.secondaryGoal': 'Secondary goal',
  'onboarding.experienceLevel': "What's your experience level?",
  'onboarding.countryRegion': 'Country / Region',
  'onboarding.language': 'Language',
  
  // Settings
  'settings.title': 'Settings',
  'settings.profile': 'Profile',
  'settings.editProfile': 'Edit Profile',
  'settings.goals': 'Goals',
  'settings.equipment': 'Equipment',
  'settings.scheduling': 'Scheduling',
  'settings.notifications': 'Notifications',
  'settings.coachTone': 'Coach Tone',
  'settings.coachVoice': 'Coach Voice',
  'settings.language': 'Language',
  'settings.country': 'Country',
  'settings.helpSupport': 'Help & Support',
  'settings.signOut': 'Sign Out',
  'settings.youAndYourPlan': 'You & Your Plan',
  'settings.preferences': 'Preferences',
  'settings.account': 'Account',
  
  // Nutrition
  'nutrition.title': 'Nutrition',
  'nutrition.mealPlan': 'Meal Plan',
  'nutrition.generateMealPlan': 'Generate Meal Plan',
  'nutrition.breakfast': 'Breakfast',
  'nutrition.lunch': 'Lunch',
  'nutrition.dinner': 'Dinner',
  'nutrition.snack': 'Snack',
  'nutrition.calories': 'Calories',
  'nutrition.protein': 'Protein',
  'nutrition.carbs': 'Carbs',
  'nutrition.fat': 'Fat',
  
  // Progress
  'progress.title': 'Progress',
  'progress.logWeight': 'Log Weight',
  'progress.logMeasurements': 'Log Measurements',
  'progress.photos': 'Photos',
  'progress.trends': 'Trends',
  
  // Subscription
  'subscription.premium': 'Premium',
  'subscription.upgrade': 'Upgrade to Premium',
  'subscription.trial': 'Trial',
  'subscription.trialEnds': 'Trial ends',
  
  // Errors
  'error.generic': 'Something went wrong. Please try again.',
  'error.network': 'Network error. Check your connection.',
  'error.loadFailed': 'Failed to load data.',
  'error.saveFailed': 'Failed to save changes.',
} as const;

// Luganda translations
export const lg: Record<TranslationKey, string> = {
  // Common
  'common.loading': 'Kiteekwa...',
  'common.save': 'Tereka',
  'common.cancel': 'Sazaamu',
  'common.confirm': 'Kakasa',
  'common.done': 'Weddemu',
  'common.next': 'Ekiddirira',
  'common.back': 'Emabega',
  'common.skip': 'Buuka',
  'common.continue': 'Weyongere',
  'common.submit': 'Waayo',
  'common.delete': 'Sazaamu',
  'common.edit': 'Kyuusa',
  'common.close': 'Ggalawo',
  'common.yes': 'Yee',
  'common.no': 'Nedda',
  'common.error': 'Ensobi',
  'common.success': 'Kituukiridde',
  'common.optional': 'si kyetaagisa',
  'common.required': 'kyetaagisibwa',
  
  // Navigation
  'nav.home': 'Awaka',
  'nav.plan': 'Enteekateeka',
  'nav.workout': 'Okuzannyisa',
  'nav.nutrition': 'Ebyokulya',
  'nav.progress': 'Enkulaakulana',
  'nav.settings': 'Entegeka',
  'nav.store': 'Edduka',
  
  // Days of the week
  'day.monday': 'Bbalaza',
  'day.tuesday': 'Lwakubiri',
  'day.wednesday': 'Lwakusatu',
  'day.thursday': 'Lwakuna',
  'day.friday': 'Lwakutaano',
  'day.saturday': 'Lwamukaaga',
  'day.sunday': 'Sande',
  'day.mon': 'Bba',
  'day.tue': 'Lw2',
  'day.wed': 'Lw3',
  'day.thu': 'Lw4',
  'day.fri': 'Lw5',
  'day.sat': 'Lw6',
  'day.sun': 'San',
  
  // Workout types
  'workout.type.strength': 'Amaanyi',
  'workout.type.cardio': 'Omutima',
  'workout.type.recovery': 'Okuwummula',
  'workout.type.core': 'Wakati',
  'workout.type.rest': 'Okuwummula',
  'workout.type.conditioning': 'Okuteekerateekera',
  
  // Workout labels
  'workout.sets': 'Ebimu',
  'workout.reps': 'Emirundi',
  'workout.rest': 'Wummula',
  'workout.duration': 'Obudde',
  'workout.warmup': 'Okwebungulula',
  'workout.cooldown': 'Okuwummula',
  'workout.mainWorkout': 'Okuzannyisa Okukulu',
  'workout.exercise': 'Okuzannyisa',
  'workout.exercises': 'Ebyokuzannyisa',
  'workout.complete': 'Weddemu',
  'workout.skip': 'Buuka',
  'workout.startWorkout': 'Tandika Okuzannyisa',
  'workout.resumeWorkout': 'Ddamu Okuzannyisa',
  'workout.endWorkout': 'Komya Okuzannyisa',
  'workout.workoutComplete': 'Okuzannyisa Kuwedde!',
  'workout.greatJob': 'Okoze bulungi nnyo!',
  'workout.todaysWorkout': 'Okuzannyisa Kw\'Olunaku Lwaleero',
  'workout.noWorkoutToday': 'Tewali kuzannyisa kwa leero',
  'workout.restDay': 'Olunaku Olw\'okuwummula',
  'workout.enjoyRestDay': 'Wummula olabe bulungi.',
  'workout.generic': 'Okuzannyisa',
  'workout.day': 'Olunaku',
  
  // Workout program names
  'workout.program.foundation': 'Omusingi',
  'workout.program.progression': 'Okweyongera',
  'workout.program.peak': 'Entikko',
  'workout.program.deload': 'Okuwewula',
  'workout.program.strength': 'Amaanyi',
  'workout.program.conditioning': 'Okuteekerateekera',
  'workout.program.mobility': 'Okutambula',
  'workout.program.custom': 'Ey\'enjawulo',
  
  // Workout focus labels
  'workout.focus.balance': 'Okwenkanankana',
  'workout.focus.strength': 'Amaanyi',
  'workout.focus.stability': 'Obunywevu',
  'workout.focus.power': 'Amaanyi Amangi',
  'workout.focus.endurance': 'Okugumira',
  'workout.focus.recovery': 'Okuwummula',
  'workout.focus.mobility': 'Okutambula',
  'workout.focus.core': 'Wakati',
  'workout.focus.upper_body': 'Ekitundu Eky\'Waggulu',
  'workout.focus.lower_body': 'Ekitundu Eky\'Wansi',
  'workout.focus.full_body': 'Omubiri Gwonna',
  'workout.focus.hiit': 'HIIT',
  'workout.focus.cardio': 'Omutima',
  
  // Plan
  'plan.title': 'Enteekateeka Yo',
  'plan.week': 'Ssabbiiti',
  'plan.block': 'Ekitundu',
  'plan.generatePlan': 'Tandika Enteekateeka Yange',
  'plan.regeneratePlan': 'Ddamu Okola Enteekateeka',
  'plan.buildNextBlock': 'Zizza Ekitundu Ekiddako',
  'plan.currentBlock': 'Ekitundu Ekiriwo',
  'plan.coachNotes': 'Ebigambo by\'Omuyigiriza',
  'plan.workoutsPerWeek': 'okuzannyisa mu ssabbiiti eno',
  'plan.planNotReady': 'Enteekateeka Yo Tenna Ready',
  'plan.generateFirst': 'Tandika enteekateeka yo esooka okutandika olugendo lwo olw\'okutendeka okw\'ssabbiiti 4.',
  'plan.readyForNextBlock': 'Weetegefu ku Kitundu Ekiddako!',
  'plan.currentBlockInProgress': 'Ekitundu Ekiriwo Kikolebwa',
  'plan.workoutsCompleted': 'ebyokuzannyisa biwezeemu',
  
  // Goals
  'goal.fatLoss': 'Okukendeeza Amasavu',
  'goal.fatLoss.desc': 'Okya amasavu ofuuke omuwewu',
  'goal.muscleGain': 'Okuzimba Ennyama',
  'goal.muscleGain.desc': 'Fumba amaanyi n\'obunene',
  'goal.endurance': 'Okugumira',
  'goal.endurance.desc': 'Longoosa okugumira n\'omutima',
  'goal.maintenance': 'Okutereka',
  'goal.maintenance.desc': 'Kuuma embeera y\'omubiri gy\'oliwo',
  
  // Experience levels
  'experience.beginner': 'Omutambuze',
  'experience.beginner.desc': 'Musu mu by\'okuzannyisa oba okkola',
  'experience.intermediate': 'Wakati',
  'experience.intermediate.desc': 'Emyaka 1-3 egy\'okutendeka obutakoma',
  'experience.advanced': 'Ow\'amaanyi',
  'experience.advanced.desc': 'Emyaka 3+ egy\'okutendeka okw\'amazima',
  
  // Gender
  'gender.male': 'Musajja',
  'gender.female': 'Mukazi',
  'gender.other': 'Ekirala',
  'gender.preferNotToSay': 'Saagala kwogera',
  
  // Onboarding
  'onboarding.aboutYou': 'Ebikukwatako',
  'onboarding.aboutYou.desc': 'Ka tukumanye obulungi',
  'onboarding.yourName': 'Erinnya Lyo',
  'onboarding.gender': 'Ekikula',
  'onboarding.height': 'Obuwanvu',
  'onboarding.weight': 'Obuzito',
  'onboarding.unitPreference': 'Engeri y\'Okupima',
  'onboarding.metric': 'Metiri (kg, cm)',
  'onboarding.imperial': 'Impeeriyali (lb, in)',
  'onboarding.primaryGoal': 'Ekigendererwa kyo ekikulu kiri ki?',
  'onboarding.secondaryGoal': 'Ekigendererwa ekyokubiri',
  'onboarding.experienceLevel': 'Omutendera gwo guli wa?',
  'onboarding.countryRegion': 'Ensi / Ekitundu',
  'onboarding.language': 'Olulimi',
  
  // Settings
  'settings.title': 'Entegeka',
  'settings.profile': 'Ebikukwatako',
  'settings.editProfile': 'Kyuusa Ebikukwatako',
  'settings.goals': 'Ebigendererwa',
  'settings.equipment': 'Ebyuma',
  'settings.scheduling': 'Entegeka y\'Obudde',
  'settings.notifications': 'Obubaka',
  'settings.coachTone': 'Eddoboozi ly\'Omuyigiriza',
  'settings.coachVoice': 'Eddoboozi ly\'Omuyigiriza',
  'settings.language': 'Olulimi',
  'settings.country': 'Ensi',
  'settings.helpSupport': 'Obuyambi',
  'settings.signOut': 'Fuluma',
  'settings.youAndYourPlan': 'Ggwe n\'Enteekateeka Yo',
  'settings.preferences': 'By\'oyagala',
  'settings.account': 'Akawunti',
  
  // Nutrition
  'nutrition.title': 'Ebyokulya',
  'nutrition.mealPlan': 'Enteekateeka y\'Emmere',
  'nutrition.generateMealPlan': 'Tandika Enteekateeka y\'Emmere',
  'nutrition.breakfast': 'Eky\'enkya',
  'nutrition.lunch': 'Eky\'emisana',
  'nutrition.dinner': 'Eky\'ekiro',
  'nutrition.snack': 'Akalirirwa',
  'nutrition.calories': 'Kkalori',
  'nutrition.protein': 'Pulootiini',
  'nutrition.carbs': 'Kabosi',
  'nutrition.fat': 'Amasavu',
  
  // Progress
  'progress.title': 'Enkulaakulana',
  'progress.logWeight': 'Wandiika Obuzito',
  'progress.logMeasurements': 'Wandiika Ebipimo',
  'progress.photos': 'Ebifaananyi',
  'progress.trends': 'Enkyukakyuka',
  
  // Subscription
  'subscription.premium': 'Ekisingayo',
  'subscription.upgrade': 'Yongera ku Kisingayo',
  'subscription.trial': 'Okugezesa',
  'subscription.trialEnds': 'Okugezesa kuggwaako',
  
  // Errors
  'error.generic': 'Waliwo ekikyamu. Gezaako nate.',
  'error.network': 'Ensobi ya netiwaki. Kebera enkolagana yo.',
  'error.loadFailed': 'Tekisobose kuteekayo data.',
  'error.saveFailed': 'Tekisobose kutereka enkyukakyuka.',
};

// Swahili translations
export const sw: Record<TranslationKey, string> = {
  // Common
  'common.loading': 'Inapakia...',
  'common.save': 'Hifadhi',
  'common.cancel': 'Ghairi',
  'common.confirm': 'Thibitisha',
  'common.done': 'Imekamilika',
  'common.next': 'Ifuatayo',
  'common.back': 'Nyuma',
  'common.skip': 'Ruka',
  'common.continue': 'Endelea',
  'common.submit': 'Wasilisha',
  'common.delete': 'Futa',
  'common.edit': 'Hariri',
  'common.close': 'Funga',
  'common.yes': 'Ndiyo',
  'common.no': 'Hapana',
  'common.error': 'Hitilafu',
  'common.success': 'Imefanikiwa',
  'common.optional': 'si lazima',
  'common.required': 'lazima',
  
  // Navigation
  'nav.home': 'Nyumbani',
  'nav.plan': 'Mpango',
  'nav.workout': 'Mazoezi',
  'nav.nutrition': 'Lishe',
  'nav.progress': 'Maendeleo',
  'nav.settings': 'Mipangilio',
  'nav.store': 'Duka',
  
  // Days of the week
  'day.monday': 'Jumatatu',
  'day.tuesday': 'Jumanne',
  'day.wednesday': 'Jumatano',
  'day.thursday': 'Alhamisi',
  'day.friday': 'Ijumaa',
  'day.saturday': 'Jumamosi',
  'day.sunday': 'Jumapili',
  'day.mon': 'Jtt',
  'day.tue': 'Jnn',
  'day.wed': 'Jtn',
  'day.thu': 'Alh',
  'day.fri': 'Ijm',
  'day.sat': 'Jms',
  'day.sun': 'Jpl',
  
  // Workout types
  'workout.type.strength': 'Nguvu',
  'workout.type.cardio': 'Moyo',
  'workout.type.recovery': 'Kupona',
  'workout.type.core': 'Kiini',
  'workout.type.rest': 'Pumziko',
  'workout.type.conditioning': 'Kujiimarisha',
  
  // Workout labels
  'workout.sets': 'Seti',
  'workout.reps': 'Marudio',
  'workout.rest': 'Pumziko',
  'workout.duration': 'Muda',
  'workout.warmup': 'Jipasha Joto',
  'workout.cooldown': 'Poa',
  'workout.mainWorkout': 'Zoezi Kuu',
  'workout.exercise': 'Zoezi',
  'workout.exercises': 'Mazoezi',
  'workout.complete': 'Maliza',
  'workout.skip': 'Ruka',
  'workout.startWorkout': 'Anza Mazoezi',
  'workout.resumeWorkout': 'Endelea Mazoezi',
  'workout.endWorkout': 'Maliza Mazoezi',
  'workout.workoutComplete': 'Mazoezi Yamekamilika!',
  'workout.greatJob': 'Umefanya vizuri sana!',
  'workout.todaysWorkout': 'Mazoezi ya Leo',
  'workout.noWorkoutToday': 'Hakuna mazoezi yaliyopangwa leo',
  'workout.restDay': 'Siku ya Kupumzika',
  'workout.enjoyRestDay': 'Pumzika na upone.',
  'workout.generic': 'Mazoezi',
  'workout.day': 'Siku',
  
  // Workout program names
  'workout.program.foundation': 'Msingi',
  'workout.program.progression': 'Maendeleo',
  'workout.program.peak': 'Kilele',
  'workout.program.deload': 'Kupunguza',
  'workout.program.strength': 'Nguvu',
  'workout.program.conditioning': 'Kujiimarisha',
  'workout.program.mobility': 'Uwezo wa Kusogea',
  'workout.program.custom': 'Maalum',
  
  // Workout focus labels
  'workout.focus.balance': 'Usawa',
  'workout.focus.strength': 'Nguvu',
  'workout.focus.stability': 'Uthabiti',
  'workout.focus.power': 'Uwezo',
  'workout.focus.endurance': 'Uvumilivu',
  'workout.focus.recovery': 'Kupona',
  'workout.focus.mobility': 'Uwezo wa Kusogea',
  'workout.focus.core': 'Kiini',
  'workout.focus.upper_body': 'Mwili wa Juu',
  'workout.focus.lower_body': 'Mwili wa Chini',
  'workout.focus.full_body': 'Mwili Mzima',
  'workout.focus.hiit': 'HIIT',
  'workout.focus.cardio': 'Moyo',
  
  // Plan
  'plan.title': 'Mpango Wako',
  'plan.week': 'Wiki',
  'plan.block': 'Kipindi',
  'plan.generatePlan': 'Tengeneza Mpango Wangu',
  'plan.regeneratePlan': 'Tengeneza Upya Mpango',
  'plan.buildNextBlock': 'Jenga Kipindi Kifuatacho',
  'plan.currentBlock': 'Kipindi cha Sasa',
  'plan.coachNotes': 'Maelezo ya Kocha',
  'plan.workoutsPerWeek': 'mazoezi wiki hii',
  'plan.planNotReady': 'Mpango Wako Haujaandaliwa',
  'plan.generateFirst': 'Tengeneza mpango wako wa kwanza kuanza safari yako ya mafunzo ya wiki 4.',
  'plan.readyForNextBlock': 'Uko Tayari kwa Kipindi Kifuatacho!',
  'plan.currentBlockInProgress': 'Kipindi cha Sasa Kinaendelea',
  'plan.workoutsCompleted': 'mazoezi yamekamilika',
  
  // Goals
  'goal.fatLoss': 'Kupunguza Mafuta',
  'goal.fatLoss.desc': 'Choma mafuta na kuwa mwembamba',
  'goal.muscleGain': 'Kujenga Misuli',
  'goal.muscleGain.desc': 'Pata nguvu na ukubwa',
  'goal.endurance': 'Uvumilivu',
  'goal.endurance.desc': 'Boresha stamina na moyo',
  'goal.maintenance': 'Kudumisha',
  'goal.maintenance.desc': 'Dumisha hali yako ya sasa',
  
  // Experience levels
  'experience.beginner': 'Mwanzo',
  'experience.beginner.desc': 'Mpya katika mazoezi au unarudi baada ya mapumziko',
  'experience.intermediate': 'Kati',
  'experience.intermediate.desc': 'Miaka 1-3 ya mafunzo ya mara kwa mara',
  'experience.advanced': 'Juu',
  'experience.advanced.desc': 'Miaka 3+ ya mafunzo mazito',
  
  // Gender
  'gender.male': 'Mwanaume',
  'gender.female': 'Mwanamke',
  'gender.other': 'Nyingine',
  'gender.preferNotToSay': 'Sipendelei kusema',
  
  // Onboarding
  'onboarding.aboutYou': 'Kuhusu Wewe',
  'onboarding.aboutYou.desc': 'Hebu tukufahamu vizuri zaidi',
  'onboarding.yourName': 'Jina Lako',
  'onboarding.gender': 'Jinsia',
  'onboarding.height': 'Urefu',
  'onboarding.weight': 'Uzito',
  'onboarding.unitPreference': 'Upendeleo wa Kipimo',
  'onboarding.metric': 'Metriki (kg, cm)',
  'onboarding.imperial': 'Kipimo cha Kiingereza (lb, in)',
  'onboarding.primaryGoal': 'Lengo lako kuu ni nini?',
  'onboarding.secondaryGoal': 'Lengo la pili',
  'onboarding.experienceLevel': 'Kiwango chako cha uzoefu ni kipi?',
  'onboarding.countryRegion': 'Nchi / Eneo',
  'onboarding.language': 'Lugha',
  
  // Settings
  'settings.title': 'Mipangilio',
  'settings.profile': 'Wasifu',
  'settings.editProfile': 'Hariri Wasifu',
  'settings.goals': 'Malengo',
  'settings.equipment': 'Vifaa',
  'settings.scheduling': 'Ratiba',
  'settings.notifications': 'Arifa',
  'settings.coachTone': 'Sauti ya Kocha',
  'settings.coachVoice': 'Sauti ya Kocha',
  'settings.language': 'Lugha',
  'settings.country': 'Nchi',
  'settings.helpSupport': 'Msaada',
  'settings.signOut': 'Ondoka',
  'settings.youAndYourPlan': 'Wewe na Mpango Wako',
  'settings.preferences': 'Mapendeleo',
  'settings.account': 'Akaunti',
  
  // Nutrition
  'nutrition.title': 'Lishe',
  'nutrition.mealPlan': 'Mpango wa Chakula',
  'nutrition.generateMealPlan': 'Tengeneza Mpango wa Chakula',
  'nutrition.breakfast': 'Kifungua Kinywa',
  'nutrition.lunch': 'Chakula cha Mchana',
  'nutrition.dinner': 'Chakula cha Jioni',
  'nutrition.snack': 'Vitafunio',
  'nutrition.calories': 'Kalori',
  'nutrition.protein': 'Protini',
  'nutrition.carbs': 'Kabohaidreti',
  'nutrition.fat': 'Mafuta',
  
  // Progress
  'progress.title': 'Maendeleo',
  'progress.logWeight': 'Rekodi Uzito',
  'progress.logMeasurements': 'Rekodi Vipimo',
  'progress.photos': 'Picha',
  'progress.trends': 'Mwenendo',
  
  // Subscription
  'subscription.premium': 'Premium',
  'subscription.upgrade': 'Panda hadi Premium',
  'subscription.trial': 'Jaribio',
  'subscription.trialEnds': 'Jaribio linaisha',
  
  // Errors
  'error.generic': 'Kuna kitu kimeenda vibaya. Tafadhali jaribu tena.',
  'error.network': 'Hitilafu ya mtandao. Angalia muunganisho wako.',
  'error.loadFailed': 'Imeshindwa kupakia data.',
  'error.saveFailed': 'Imeshindwa kuhifadhi mabadiliko.',
};

/**
 * Stub translations for languages not yet fully translated.
 * These use English as fallback - the LanguageContext handles this gracefully.
 * As translations are completed, replace these with full translation objects.
 */
const createFallbackTranslations = (): Record<TranslationKey, string> => ({ ...en });

// Spanish placeholder (will fall back to English for missing keys)
export const es: Record<TranslationKey, string> = createFallbackTranslations();

// Portuguese placeholder
export const pt: Record<TranslationKey, string> = createFallbackTranslations();

// French placeholder
export const fr: Record<TranslationKey, string> = createFallbackTranslations();

// Chinese (Simplified) placeholder
export const zh: Record<TranslationKey, string> = createFallbackTranslations();

// Japanese placeholder
export const ja: Record<TranslationKey, string> = createFallbackTranslations();

// Russian placeholder
export const ru: Record<TranslationKey, string> = createFallbackTranslations();

// German placeholder
export const de: Record<TranslationKey, string> = createFallbackTranslations();

// Dutch placeholder
export const nl: Record<TranslationKey, string> = createFallbackTranslations();

// Italian placeholder
export const it: Record<TranslationKey, string> = createFallbackTranslations();

// Afrikaans placeholder
export const af: Record<TranslationKey, string> = createFallbackTranslations();

// Translation map by language code
export const translations: Record<string, Record<TranslationKey, string>> = {
  en,
  es,
  pt,
  fr,
  zh,
  ja,
  ru,
  de,
  nl,
  it,
  sw,
  af,
  lg,
};
