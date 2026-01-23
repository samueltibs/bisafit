import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserProfile {
  id: string;
  goal_primary: string | null;
  goal_secondary: string | null;
  experience_level: string | null;
  days_per_week: number | null;
  session_minutes: number | null;
  rest_day: string | null;
  workout_days: string[] | null;
  constraints_json: {
    injury_flags?: string[];
    preferences?: string[];
    notes?: string;
  } | null;
  equipment_json: string[] | null;
  height_cm: number | null;
  weight_kg: number | null;
  unit_preference: string | null;
  full_name: string | null;
}

interface WorkoutBlock {
  type: "warmup" | "strength" | "conditioning" | "cooldown";
  items: Array<{
    name: string;
    duration_sec?: number;
    sets?: number;
    reps?: string;
    rest_sec?: number;
    tempo?: string;
    instructions: string;
    video_url_optional?: string;
  }>;
  protocol?: {
    work_sec: number;
    rest_sec: number;
    rounds: number;
  };
}

interface WorkoutJson {
  title: string;
  week_number: number;
  total_estimated_minutes: number;
  blocks: WorkoutBlock[];
}

// Updated PlanDay with explicit type
interface PlanDay {
  day_name: string;
  type: "workout" | "rest";
  focus?: string;
  workout_id?: string;
  label?: string;
}

interface PlanWeek {
  week_number: number;
  days: PlanDay[];
}

interface PlanJson {
  block_number: number;
  weeks: PlanWeek[];
  progression_strategy: string;
  progression_notes: string;
  coach_notes: string;
}

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("users_profile")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userProfile = profile as UserProfile;

    // Get completed workout count from last plan (if exists)
    const { data: lastPlan } = await supabase
      .from("plans")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let completedWorkoutsCount = 0;
    let blockNumber = 1;

    if (lastPlan) {
      blockNumber = 2; // This would be the next block
      const { count } = await supabase
        .from("workout_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("completed_at", "is", null);
      
      completedWorkoutsCount = count || 0;
    }

    // Determine workout days - use workout_days if available, otherwise fallback
    const workoutDays = getWorkoutDays(userProfile);

    console.log("Generating plan for user:", userId);
    console.log("User profile summary:", {
      goal: userProfile.goal_primary,
      experience: userProfile.experience_level,
      days: workoutDays.length,
      minutes: userProfile.session_minutes,
      equipment: userProfile.equipment_json,
      workoutDays,
    });

    // Build the prompt for AI
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(userProfile, completedWorkoutsCount, blockNumber, workoutDays);

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_training_plan",
              description: "Create a complete 4-week progressive training plan with workouts for specified days only",
              parameters: {
                type: "object",
                properties: {
                  plan: {
                    type: "object",
                    properties: {
                      block_number: { type: "number" },
                      progression_strategy: { type: "string" },
                      progression_notes: { type: "string" },
                      coach_notes: { type: "string" },
                    },
                    required: ["block_number", "progression_strategy", "progression_notes", "coach_notes"],
                  },
                  workouts: {
                    type: "array",
                    description: "Array of workouts for the specified workout days only. Do NOT include rest days.",
                    items: {
                      type: "object",
                      properties: {
                        week_number: { type: "number" },
                        day_name: { type: "string" },
                        focus: { type: "string" },
                        workout: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            total_estimated_minutes: { type: "number" },
                            blocks: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  type: { type: "string", enum: ["warmup", "strength", "conditioning", "cooldown"] },
                                  items: {
                                    type: "array",
                                    items: {
                                      type: "object",
                                      properties: {
                                        name: { type: "string" },
                                        duration_sec: { type: "number" },
                                        sets: { type: "number" },
                                        reps: { type: "string" },
                                        rest_sec: { type: "number" },
                                        tempo: { type: "string" },
                                        instructions: { type: "string" },
                                      },
                                      required: ["name", "instructions"],
                                    },
                                  },
                                  protocol: {
                                    type: "object",
                                    properties: {
                                      work_sec: { type: "number" },
                                      rest_sec: { type: "number" },
                                      rounds: { type: "number" },
                                    },
                                  },
                                },
                                required: ["type", "items"],
                              },
                            },
                          },
                          required: ["title", "total_estimated_minutes", "blocks"],
                        },
                      },
                      required: ["week_number", "day_name", "focus", "workout"],
                    },
                  },
                },
                required: ["plan", "workouts"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_training_plan" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract the tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const generatedData = JSON.parse(toolCall.function.arguments);
    const { plan: planMeta, workouts: generatedWorkouts } = generatedData;

    // Calculate start date - find next occurrence of earliest workout day (could be today)
    const startDate = calculatePlanStartDate(workoutDays);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Create plan record first
    const planJson: PlanJson = {
      block_number: blockNumber,
      weeks: [],
      progression_strategy: planMeta.progression_strategy,
      progression_notes: planMeta.progression_notes,
      coach_notes: planMeta.coach_notes,
    };

    const { data: newPlan, error: planError } = await supabase
      .from("plans")
      .insert({
        user_id: userId,
        name: `Training Block ${blockNumber}`,
        start_date: startDateStr,
        weeks: 4,
        plan_json: planJson,
      })
      .select()
      .single();

    if (planError || !newPlan) {
      console.error("Failed to create plan:", planError);
      throw new Error("Failed to create plan record");
    }

    // Prepare workout inserts
    const workoutInserts: Array<{
      user_id: string;
      plan_id: string;
      title: string;
      scheduled_date: string;
      workout_json: WorkoutJson;
    }> = [];

    for (const genWorkout of generatedWorkouts) {
      // Calculate scheduled date
      const dayIndex = getDayIndex(genWorkout.day_name);
      const weekOffset = (genWorkout.week_number - 1) * 7;
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(startDate.getDate() + weekOffset + dayIndex);
      const scheduledDateStr = scheduledDate.toISOString().split("T")[0];

      const workoutJson: WorkoutJson = {
        title: genWorkout.workout.title,
        week_number: genWorkout.week_number,
        total_estimated_minutes: genWorkout.workout.total_estimated_minutes,
        blocks: genWorkout.workout.blocks,
      };

      workoutInserts.push({
        user_id: userId,
        plan_id: newPlan.id,
        title: genWorkout.workout.title,
        scheduled_date: scheduledDateStr,
        workout_json: workoutJson,
      });
    }

    // Insert all workouts
    const { data: insertedWorkouts, error: workoutsError } = await supabase
      .from("workouts")
      .insert(workoutInserts)
      .select();

    if (workoutsError) {
      console.error("Failed to insert workouts:", workoutsError);
      throw new Error("Failed to create workout records");
    }

    // Build workout ID map by scheduled date
    const workoutIdMap = new Map<string, string>();
    for (const workout of insertedWorkouts || []) {
      workoutIdMap.set(workout.scheduled_date, workout.id);
    }

    // Build final weeks structure with explicit type field
    const finalWeeks: PlanWeek[] = [];
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      const weekDays: PlanDay[] = [];
      
      for (const dayName of ALL_DAYS) {
        const dayIndex = getDayIndex(dayName);
        const weekOffset = (weekNum - 1) * 7;
        const scheduledDate = new Date(startDate);
        scheduledDate.setDate(startDate.getDate() + weekOffset + dayIndex);
        const scheduledDateStr = scheduledDate.toISOString().split("T")[0];

        if (workoutDays.includes(dayName)) {
          // This is a workout day
          const genWorkout = generatedWorkouts.find(
            (w: { week_number: number; day_name: string }) => w.week_number === weekNum && w.day_name === dayName
          );
          const workoutId = workoutIdMap.get(scheduledDateStr) || "";
          
          weekDays.push({
            day_name: dayName,
            type: "workout",
            focus: genWorkout?.focus || "Training",
            workout_id: workoutId,
          });
        } else {
          // This is a rest day
          weekDays.push({
            day_name: dayName,
            type: "rest",
            label: "Rest Day",
          });
        }
      }
      
      finalWeeks.push({
        week_number: weekNum,
        days: weekDays,
      });
    }

    // Update plan with complete plan_json
    const completePlanJson: PlanJson = {
      ...planJson,
      weeks: finalWeeks,
    };

    await supabase
      .from("plans")
      .update({ plan_json: completePlanJson })
      .eq("id", newPlan.id);

    console.log("Plan generation complete:", newPlan.id);

    return new Response(
      JSON.stringify({
        success: true,
        plan_id: newPlan.id,
        message: "Your personalized 4-week training plan has been created!",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Plan generation error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate plan",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getDayIndex(dayName: string): number {
  const days: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };
  return days[dayName] ?? 0;
}

/**
 * Get workout days from profile - uses workout_days if available, otherwise builds from legacy fields
 */
function getWorkoutDays(profile: UserProfile): string[] {
  // If workout_days is set, use it directly
  if (profile.workout_days && Array.isArray(profile.workout_days) && profile.workout_days.length > 0) {
    return profile.workout_days.sort((a, b) => getDayIndex(a) - getDayIndex(b));
  }

  // Fallback: build from days_per_week and rest_day
  const daysPerWeek = profile.days_per_week || 4;
  const preferredRestDay = profile.rest_day || "Sunday";

  // Optimal day distributions for different training frequencies
  const dayDistributions: Record<number, string[]> = {
    2: ["Monday", "Thursday"],
    3: ["Monday", "Wednesday", "Friday"],
    4: ["Monday", "Tuesday", "Thursday", "Friday"],
    5: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    6: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    7: ALL_DAYS,
  };

  const baseDistribution = dayDistributions[daysPerWeek] || dayDistributions[4];
  const workoutDays: string[] = [];

  for (const day of baseDistribution) {
    if (day !== preferredRestDay) {
      workoutDays.push(day);
    }
  }

  // If we filtered out the rest day and need more workout days, add alternates
  if (workoutDays.length < daysPerWeek) {
    const alternatives = ALL_DAYS.filter(d => !workoutDays.includes(d) && d !== preferredRestDay);
    for (const alt of alternatives) {
      if (workoutDays.length >= daysPerWeek) break;
      workoutDays.push(alt);
    }
  }

  // Limit to exact days per week
  while (workoutDays.length > daysPerWeek) {
    workoutDays.pop();
  }

  return workoutDays.sort((a, b) => getDayIndex(a) - getDayIndex(b));
}

/**
 * Calculate plan start date - finds the next occurrence of the earliest workout day
 * If today is a workout day, start from today
 */
function calculatePlanStartDate(workoutDays: string[]): Date {
  const today = new Date();
  const todayDayIndex = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 format
  
  // Find the index of today in the ALL_DAYS array format
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const todayName = dayNames[todayDayIndex];
  
  // If today is a workout day, start from today
  if (workoutDays.includes(todayName)) {
    // Set to start of day
    today.setHours(0, 0, 0, 0);
    return today;
  }
  
  // Find the next workout day
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    const checkDayIndex = (checkDate.getDay() + 6) % 7;
    const checkDayName = dayNames[checkDayIndex];
    
    if (workoutDays.includes(checkDayName)) {
      checkDate.setHours(0, 0, 0, 0);
      return checkDate;
    }
  }
  
  // Fallback to next Monday if no workout days found (shouldn't happen)
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + daysUntilMonday);
  startDate.setHours(0, 0, 0, 0);
  return startDate;
}

function buildSystemPrompt(): string {
  return `You are an expert fitness coach AI that creates personalized, progressive 4-week training programs.

CRITICAL RULES:
1. Only use exercises that match the user's available equipment. Bodyweight exercises are always allowed.
2. Respect ALL injury flags and constraints - never program movements that could aggravate injuries.
3. Stay within the target session duration (±5 minutes).
4. Create progressive overload across the 4 weeks:
   - Week 1: Conservative, establish baselines, moderate intensity
   - Week 2: Slight increase in volume or intensity
   - Week 3: Peak volume/intensity week
   - Week 4: Deload - reduce volume by 30-40% while maintaining intensity
5. For beginners: Simple compound movements, no max testing, focus on form cues.
6. For intermediate/advanced: Can include more complex movements if equipment supports it.
7. Each workout must have: warmup (5-10 min), main work, cooldown (3-5 min).
8. Avoid identical workouts on consecutive weeks - show clear progression.
9. ONLY generate workouts for the specified workout days. Do NOT include rest days in the output.

EQUIPMENT MAPPING:
- "bodyweight": All bodyweight exercises
- "dumbbells": DB exercises (presses, rows, curls, etc.)
- "barbell": BB exercises (squats, deadlifts, bench, rows)
- "kettlebell": KB swings, goblet squats, Turkish getups
- "resistance_bands": Band exercises, assisted movements
- "pull_up_bar": Pull-ups, chin-ups, hanging exercises
- "bench": Bench exercises, step-ups
- "cable_machine": Cable exercises

GOAL MAPPING (Primary goal drives the plan, secondary goal lightly influences variety):
- "fat_loss": Higher volume, shorter rest, include conditioning blocks
- "muscle_gain": Moderate volume, focus on progressive overload, hypertrophy rep ranges (8-12)
- "strength": Lower rep ranges (3-6), longer rest, compound focus
- "maintenance": Balanced approach, moderate everything
- "endurance": Higher reps (15+), circuit style, conditioning focus

SECONDARY GOAL INFLUENCE:
- If secondary = "fat_loss": Add 1-2 conditioning finishers per week
- If secondary = "muscle_gain": Include accessory work for variety
- If secondary = "endurance": Increase rep ranges slightly, add cardio intervals
- If secondary = "strength": Include heavier compound sets where appropriate`;
}

function buildUserPrompt(
  profile: UserProfile,
  completedWorkouts: number,
  blockNumber: number,
  workoutDays: string[]
): string {
  const equipment = profile.equipment_json || ["bodyweight"];
  const constraints = profile.constraints_json || {};
  const injuries = constraints.injury_flags || [];
  const preferences = constraints.preferences || [];
  const constraintNotes = constraints.notes || "";

  let injuryWarnings = "";
  if (injuries.length > 0) {
    injuryWarnings = `
INJURY RESTRICTIONS (MUST AVOID):
${injuries.map((i) => `- ${i}: Avoid exercises that stress this area`).join("\n")}`;
  }

  let preferenceNotes = "";
  if (preferences.length > 0) {
    preferenceNotes = `
TRAINING PREFERENCES:
${preferences.map((p) => `- ${p}`).join("\n")}`;
  }

  return `Create a 4-week progressive training plan for this user:

USER PROFILE:
- Name: ${profile.full_name || "User"}
- Primary Goal: ${profile.goal_primary || "maintenance"}
- Secondary Goal: ${profile.goal_secondary || "None (focus only on primary)"}
- Experience Level: ${profile.experience_level || "beginner"}
- Training Days Per Week: ${workoutDays.length}
- Session Duration: ${profile.session_minutes || 45} minutes (±5 min acceptable)
- Height: ${profile.height_cm ? `${profile.height_cm} cm` : "Not specified"}
- Weight: ${profile.weight_kg ? `${profile.weight_kg} kg` : "Not specified"}

WORKOUT DAYS (only create workouts for these days):
${workoutDays.map((d) => `- ${d}`).join("\n")}

AVAILABLE EQUIPMENT:
${equipment.map((e) => `- ${e}`).join("\n")}
${injuryWarnings}
${preferenceNotes}
${constraintNotes ? `\nADDITIONAL NOTES: ${constraintNotes}` : ""}

CONTEXT:
- This is Training Block #${blockNumber}
- User has completed ${completedWorkouts} workouts previously
${completedWorkouts > 0 ? "- Build on their previous progress with appropriate progression" : "- First time user - start conservatively"}

REQUIRED OUTPUT:
Generate exactly ${workoutDays.length} workouts per week across all 4 weeks (${workoutDays.length * 4} total workouts).
Each workout must be assigned to one of the specified workout days.
Each workout should have warmup, main training blocks (strength/conditioning), and cooldown.

Make the plan specific, actionable, and encouraging. Include clear instructions for each exercise.`;
}
