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

/**
 * CRITICAL: Normalize workout_days array to ensure strict, deterministic scheduling.
 * - Trims and capitalizes to match exactly: Monday..Sunday
 * - Removes duplicates
 * - Sorts in week order
 * - If empty, defaults to ["Monday", "Wednesday", "Thursday", "Friday"]
 */
function normalizeWorkoutDays(days: unknown): string[] {
  const defaultDays = ["Monday", "Wednesday", "Thursday", "Friday"];
  
  if (!Array.isArray(days) || days.length === 0) {
    console.log("No workout_days found, using default:", defaultDays);
    return defaultDays;
  }

  const normalizedSet = new Set<string>();
  
  for (const day of days) {
    if (typeof day !== "string") continue;
    
    // Trim and capitalize first letter
    const trimmed = day.trim();
    const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    
    // Only accept valid day names
    if (ALL_DAYS.includes(normalized)) {
      normalizedSet.add(normalized);
    }
  }
  
  if (normalizedSet.size === 0) {
    console.log("No valid workout_days after normalization, using default:", defaultDays);
    return defaultDays;
  }
  
  // Sort in week order (Monday = 0, Sunday = 6)
  const sorted = Array.from(normalizedSet).sort((a, b) => 
    ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b)
  );
  
  console.log("Normalized workout_days:", sorted);
  return sorted;
}

/**
 * Calculate plan start date based on workout_days.
 * - If today is a workout day, start from today
 * - Otherwise, find the next occurrence of any workout day
 */
function calculatePlanStartDate(workoutDays: string[]): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get today's day name (Monday-based)
  const todayDayIndex = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  const todayName = ALL_DAYS[todayDayIndex];
  
  console.log("Today is:", todayName, "Workout days:", workoutDays);
  
  // If today is a workout day, start from today
  if (workoutDays.includes(todayName)) {
    console.log("Today is a workout day, starting plan from today");
    return today;
  }
  
  // Find the next workout day
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    const checkDayIndex = (checkDate.getDay() + 6) % 7;
    const checkDayName = ALL_DAYS[checkDayIndex];
    
    if (workoutDays.includes(checkDayName)) {
      console.log("Next workout day is:", checkDayName, "starting plan from:", checkDate.toISOString());
      return checkDate;
    }
  }
  
  // Fallback (shouldn't happen with valid workout_days)
  console.log("No workout day found within next 7 days, starting from today");
  return today;
}

/**
 * Get day index (0 = Monday, 6 = Sunday)
 */
function getDayIndex(dayName: string): number {
  return ALL_DAYS.indexOf(dayName);
}

/**
 * Calculate the date offset from start_date for a given week and day.
 * Week 1 starts at start_date, week 2 at start_date + 7, etc.
 * Days are offset by their position in the week relative to start_date's day.
 */
function calculateScheduledDate(startDate: Date, weekNumber: number, dayName: string): Date {
  const startDayIndex = (startDate.getDay() + 6) % 7; // Monday = 0
  const targetDayIndex = getDayIndex(dayName);
  
  // Calculate days from start_date to this day in week 1
  let daysOffset = targetDayIndex - startDayIndex;
  if (daysOffset < 0) {
    daysOffset += 7; // Wrap to next week
  }
  
  // Add week offset (weekNumber is 1-indexed)
  daysOffset += (weekNumber - 1) * 7;
  
  const scheduledDate = new Date(startDate);
  scheduledDate.setDate(startDate.getDate() + daysOffset);
  return scheduledDate;
}

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

    // CRITICAL: Fetch user profile FRESH from database (not from any cache)
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

    // STRICT: Use normalized workout_days - NO fallback algorithms
    const workoutDays = normalizeWorkoutDays(userProfile.workout_days);

    console.log("=== PLAN GENERATION START ===");
    console.log("User ID:", userId);
    console.log("workout_days from profile:", userProfile.workout_days);
    console.log("Normalized workout_days:", workoutDays);
    console.log("Goal primary:", userProfile.goal_primary);
    console.log("Goal secondary:", userProfile.goal_secondary);
    console.log("Session minutes:", userProfile.session_minutes);
    console.log("Equipment:", userProfile.equipment_json);

    // CRITICAL: Compute block number from MAX of all existing plans
    const { data: existingPlans } = await supabase
      .from("plans")
      .select("id, plan_json")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    let maxBlockNumber = 0;
    if (existingPlans && existingPlans.length > 0) {
      for (const p of existingPlans) {
        const pJson = p.plan_json as PlanJson;
        const blockNum = pJson?.block_number || 0;
        if (blockNum > maxBlockNumber) {
          maxBlockNumber = blockNum;
        }
      }
    }
    
    // When regenerating, we replace the current plan but keep same block number
    // For first plan, block_number = 1
    const blockNumber = existingPlans && existingPlans.length > 0 ? maxBlockNumber : 1;
    let completedWorkoutsCount = 0;

    if (existingPlans && existingPlans.length > 0) {
      // Count completed workouts for progression context
      const { count } = await supabase
        .from("workout_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("completed_at", "is", null);
      
      completedWorkoutsCount = count || 0;
      
      // Delete workouts from the most recent plan (they will be replaced)
      const mostRecentPlanId = existingPlans[0].id;
      console.log("Deleting old workouts for plan:", mostRecentPlanId);
      
      await supabase
        .from("workouts")
        .delete()
        .eq("plan_id", mostRecentPlanId);
        
      // Delete the old plan itself (regeneration replaces it)
      await supabase
        .from("plans")
        .delete()
        .eq("id", mostRecentPlanId);
    }

    // Build the prompt for AI
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(userProfile, completedWorkoutsCount, blockNumber, workoutDays);

    console.log("Calling AI with", workoutDays.length, "workout days per week");

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
              description: "Create a complete 4-week progressive training plan with workouts ONLY for specified workout days",
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
                    description: "Array of workouts ONLY for the specified workout days. Must match exactly the workout_days provided.",
                    items: {
                      type: "object",
                      properties: {
                        week_number: { type: "number" },
                        day_name: { type: "string", enum: ALL_DAYS },
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

    // Define the expected structure type
    interface GeneratedPlanData {
      plan: {
        block_number: number;
        progression_strategy: string;
        progression_notes: string;
        coach_notes: string;
      };
      workouts: Array<{
        week_number: number;
        day_name: string;
        focus: string;
        workout: {
          title: string;
          total_estimated_minutes: number;
          blocks: WorkoutBlock[];
        };
      }>;
    }

    // Extract the tool call result OR fallback to text content parsing
    let generatedData: GeneratedPlanData;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall) {
      // Normal tool call response
      generatedData = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: AI returned text content instead of tool call
      console.log("No tool call found, attempting to parse text content...");
      const textContent = aiData.choices?.[0]?.message?.content;
      
      if (!textContent) {
        console.error("AI response has no tool call and no text content");
        throw new Error("AI returned empty response. Please try again.");
      }
      
      // Try to extract JSON from the text content
      try {
        // Remove markdown code blocks if present
        let cleanedContent = textContent
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();
        
        // Try to find JSON object in the response
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          generatedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in AI text response");
        }
      } catch (parseErr) {
        console.error("Failed to parse AI text content as JSON:", parseErr);
        console.error("Text content:", textContent.substring(0, 500));
        throw new Error("AI response format error. Please try again.");
      }
    }
    
    const { plan: planMeta, workouts: generatedWorkouts } = generatedData;

    console.log("AI generated", generatedWorkouts.length, "workouts");
    console.log("Expected:", workoutDays.length * 4, "workouts");

    // Calculate start date based on workout_days
    const startDate = calculatePlanStartDate(workoutDays);
    const startDateStr = startDate.toISOString().split("T")[0];

    console.log("Plan start date:", startDateStr);

    // Build the complete plan_json structure with all 7 days per week
    const finalWeeks: PlanWeek[] = [];
    
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      const weekDays: PlanDay[] = [];
      
      for (const dayName of ALL_DAYS) {
        if (workoutDays.includes(dayName)) {
          // This is a workout day - find the generated workout
          const genWorkout = generatedWorkouts.find(
            (w: { week_number: number; day_name: string }) => 
              w.week_number === weekNum && w.day_name === dayName
          );
          
          weekDays.push({
            day_name: dayName,
            type: "workout",
            focus: genWorkout?.focus || "Training",
            workout_id: "", // Will be updated after workout insert
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

    // Create plan record
    const planJson: PlanJson = {
      block_number: blockNumber,
      weeks: finalWeeks,
      progression_strategy: planMeta.progression_strategy,
      progression_notes: planMeta.progression_notes,
      coach_notes: planMeta.coach_notes,
    };

    // Create first plan as in_progress and set as current
    const { data: newPlan, error: planError } = await supabase
      .from("plans")
      .insert({
        user_id: userId,
        name: `Training Block ${blockNumber}`,
        start_date: startDateStr,
        weeks: 4,
        plan_json: planJson,
        block_number: blockNumber,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (planError || !newPlan) {
      console.error("Failed to create plan:", planError);
      throw new Error("Failed to create plan record");
    }

    console.log("Plan created:", newPlan.id);

    // Prepare workout inserts - ONLY for workout days
    const workoutInserts: Array<{
      user_id: string;
      plan_id: string;
      title: string;
      scheduled_date: string;
      workout_json: WorkoutJson;
    }> = [];

    for (const genWorkout of generatedWorkouts) {
      // Validate that AI only generated for our workout days
      if (!workoutDays.includes(genWorkout.day_name)) {
        console.warn(`AI generated workout for non-workout day: ${genWorkout.day_name}, skipping`);
        continue;
      }

      const scheduledDate = calculateScheduledDate(startDate, genWorkout.week_number, genWorkout.day_name);
      const scheduledDateStr = scheduledDate.toISOString().split("T")[0];

      console.log(`Scheduling workout: Week ${genWorkout.week_number}, ${genWorkout.day_name} -> ${scheduledDateStr}`);

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

    console.log("Inserting", workoutInserts.length, "workouts");

    // Insert all workouts
    const { data: insertedWorkouts, error: workoutsError } = await supabase
      .from("workouts")
      .insert(workoutInserts)
      .select();

    if (workoutsError) {
      console.error("Failed to insert workouts:", workoutsError);
      throw new Error("Failed to create workout records");
    }

    // Build workout ID map by (week_number, day_name) from workout_json
    const workoutIdMap = new Map<string, string>();
    for (const workout of insertedWorkouts || []) {
      const wJson = workout.workout_json as unknown as WorkoutJson;
      const key = `${wJson.week_number}-${workout.scheduled_date}`;
      workoutIdMap.set(workout.scheduled_date, workout.id);
    }

    // Update plan_json with workout IDs
    for (const week of finalWeeks) {
      for (const day of week.days) {
        if (day.type === "workout") {
          const scheduledDate = calculateScheduledDate(startDate, week.week_number, day.day_name);
          const scheduledDateStr = scheduledDate.toISOString().split("T")[0];
          day.workout_id = workoutIdMap.get(scheduledDateStr) || "";
        }
      }
    }

    // Update plan with workout IDs
    const completePlanJson: PlanJson = {
      ...planJson,
      weeks: finalWeeks,
    };

    await supabase
      .from("plans")
      .update({ plan_json: completePlanJson })
      .eq("id", newPlan.id);

    // Set this plan as the user's current plan
    await supabase
      .from("users_profile")
      .update({ current_plan_id: newPlan.id })
      .eq("id", userId);

    console.log("=== PLAN GENERATION COMPLETE ===");
    console.log("Plan ID:", newPlan.id);
    console.log("Workouts created:", insertedWorkouts?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        plan_id: newPlan.id,
        message: "Your personalized 4-week training plan has been created!",
        debug: {
          workout_days: workoutDays,
          start_date: startDateStr,
          workouts_created: insertedWorkouts?.length || 0,
        },
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
9. CRITICAL: ONLY generate workouts for the EXACT workout days specified. Do NOT include any other days.
10. Each week must have the SAME workout days. Do not vary which days have workouts across weeks.

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

  const totalWorkouts = workoutDays.length * 4;

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

WORKOUT DAYS - STRICT (only create workouts for EXACTLY these days, same days every week):
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
Generate EXACTLY ${totalWorkouts} workouts total:
- ${workoutDays.length} workouts per week × 4 weeks = ${totalWorkouts} workouts
- Each week MUST have workouts ONLY on: ${workoutDays.join(", ")}
- Do NOT create workouts for any other days
- Each workout should have warmup, main training blocks (strength/conditioning), and cooldown

Make the plan specific, actionable, and encouraging. Include clear instructions for each exercise.`;
}
