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
  workout_days: string[] | null;
  constraints_json: {
    injury_flags?: string[];
    preferences?: string[];
    notes?: string;
  } | null;
  equipment_json: string[] | null;
  full_name: string | null;
}

interface WorkoutSession {
  id: string;
  workout_id: string;
  started_at: string;
  completed_at: string | null;
  session_log_json: {
    sets?: Array<{
      exercise: string;
      weight?: number;
      reps?: number;
      completed?: boolean;
    }>;
  } | null;
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

interface PerformanceAnalysis {
  adherence_rate: number;
  completed_workouts: number;
  planned_workouts: number;
  average_completion_rate: number;
  fatigue_signal: "low" | "moderate" | "high";
  progression_recommendation: "increase" | "maintain" | "decrease";
  exercise_summaries: Array<{
    name: string;
    avg_weight?: number;
    avg_reps?: number;
    frequency: number;
  }>;
}

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function normalizeWorkoutDays(days: unknown): string[] {
  const defaultDays = ["Monday", "Wednesday", "Thursday", "Friday"];
  
  if (!Array.isArray(days) || days.length === 0) {
    return defaultDays;
  }

  const normalizedSet = new Set<string>();
  
  for (const day of days) {
    if (typeof day !== "string") continue;
    const trimmed = day.trim();
    const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    if (ALL_DAYS.includes(normalized)) {
      normalizedSet.add(normalized);
    }
  }
  
  if (normalizedSet.size === 0) {
    return defaultDays;
  }
  
  return Array.from(normalizedSet).sort((a, b) => 
    ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b)
  );
}

function calculateNextBlockStartDate(previousEndDate: string, workoutDays: string[]): Date {
  // Start the day after the previous block ends
  const nextStart = new Date(previousEndDate);
  nextStart.setDate(nextStart.getDate() + 1);
  nextStart.setHours(0, 0, 0, 0);
  
  // Find the next workout day
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(nextStart);
    checkDate.setDate(nextStart.getDate() + i);
    const dayIndex = (checkDate.getDay() + 6) % 7;
    const dayName = ALL_DAYS[dayIndex];
    
    if (workoutDays.includes(dayName)) {
      return checkDate;
    }
  }
  
  return nextStart;
}

function getDayIndex(dayName: string): number {
  return ALL_DAYS.indexOf(dayName);
}

function calculateScheduledDate(startDate: Date, weekNumber: number, dayName: string): Date {
  const startDayIndex = (startDate.getDay() + 6) % 7;
  const targetDayIndex = getDayIndex(dayName);
  
  let daysOffset = targetDayIndex - startDayIndex;
  if (daysOffset < 0) {
    daysOffset += 7;
  }
  
  daysOffset += (weekNumber - 1) * 7;
  
  const scheduledDate = new Date(startDate);
  scheduledDate.setDate(startDate.getDate() + daysOffset);
  return scheduledDate;
}

function analyzePerformance(
  sessions: WorkoutSession[],
  plannedWorkouts: number
): PerformanceAnalysis {
  const completedSessions = sessions.filter(s => s.completed_at !== null);
  const adherenceRate = plannedWorkouts > 0 
    ? completedSessions.length / plannedWorkouts 
    : 0;
  
  // Analyze exercise performance
  const exerciseMap = new Map<string, { weights: number[]; reps: number[]; count: number }>();
  
  for (const session of completedSessions) {
    const sets = session.session_log_json?.sets || [];
    for (const set of sets) {
      if (!set.exercise || !set.completed) continue;
      
      const existing = exerciseMap.get(set.exercise) || { weights: [], reps: [], count: 0 };
      if (set.weight) existing.weights.push(set.weight);
      if (set.reps) existing.reps.push(set.reps);
      existing.count++;
      exerciseMap.set(set.exercise, existing);
    }
  }
  
  const exerciseSummaries = Array.from(exerciseMap.entries()).map(([name, data]) => ({
    name,
    avg_weight: data.weights.length > 0 
      ? data.weights.reduce((a, b) => a + b, 0) / data.weights.length 
      : undefined,
    avg_reps: data.reps.length > 0 
      ? data.reps.reduce((a, b) => a + b, 0) / data.reps.length 
      : undefined,
    frequency: data.count,
  }));
  
  // Determine fatigue signal
  let fatigueSignal: "low" | "moderate" | "high" = "low";
  if (adherenceRate < 0.6) {
    fatigueSignal = "high";
  } else if (adherenceRate < 0.8) {
    fatigueSignal = "moderate";
  }
  
  // Determine progression recommendation
  let progressionRecommendation: "increase" | "maintain" | "decrease" = "maintain";
  if (adherenceRate >= 0.8) {
    progressionRecommendation = "increase";
  } else if (adherenceRate < 0.6) {
    progressionRecommendation = "decrease";
  }
  
  return {
    adherence_rate: Math.round(adherenceRate * 100) / 100,
    completed_workouts: completedSessions.length,
    planned_workouts: plannedWorkouts,
    average_completion_rate: adherenceRate,
    fatigue_signal: fatigueSignal,
    progression_recommendation: progressionRecommendation,
    exercise_summaries: exerciseSummaries,
  };
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Parse request body for user feedback
    let userFeedback: string | null = null;
    try {
      const body = await req.json();
      userFeedback = body.feedback || null;
    } catch {
      // No body or invalid JSON - that's ok
    }

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
    const workoutDays = normalizeWorkoutDays(userProfile.workout_days);

    // Get the current/latest plan
    const { data: currentPlan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (planError || !currentPlan) {
      return new Response(JSON.stringify({ error: "No existing plan found. Generate a first plan first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentPlanJson = currentPlan.plan_json as PlanJson;
    
    // CRITICAL: Compute next block number from MAX of all plans, not just current
    const { data: allPlans } = await supabase
      .from("plans")
      .select("plan_json")
      .eq("user_id", userId);
    
    let maxBlockNumber = 0;
    if (allPlans && allPlans.length > 0) {
      for (const p of allPlans) {
        const pJson = p.plan_json as PlanJson;
        const blockNum = pJson?.block_number || 0;
        if (blockNum > maxBlockNumber) {
          maxBlockNumber = blockNum;
        }
      }
    }
    
    const newBlockNumber = maxBlockNumber + 1;

    // Calculate end date of current plan (4 weeks from start)
    const currentStartDate = new Date(currentPlan.start_date);
    const currentEndDate = new Date(currentStartDate);
    currentEndDate.setDate(currentEndDate.getDate() + 27); // 4 weeks - 1 day
    
    const newStartDate = calculateNextBlockStartDate(
      currentEndDate.toISOString().split("T")[0],
      workoutDays
    );
    const newStartDateStr = newStartDate.toISOString().split("T")[0];

    // SERVER-SIDE GUARD: Check if a plan with this start_date already exists
    const { data: existingPlanForDate } = await supabase
      .from("plans")
      .select("id, plan_json")
      .eq("user_id", userId)
      .eq("start_date", newStartDateStr)
      .limit(1)
      .maybeSingle();

    if (existingPlanForDate) {
      const existingPlanJson = existingPlanForDate.plan_json as PlanJson;
      console.log("Plan for this start date already exists, returning existing plan");
      return new Response(JSON.stringify({
        success: true,
        plan_id: existingPlanForDate.id,
        block_number: existingPlanJson.block_number,
        start_date: newStartDateStr,
        message: "A plan for this block already exists.",
        existing: true,
        analysis: {
          adherence_rate: 0,
          progression_applied: "none - existing plan",
        },
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all workout IDs from the current plan
    const workoutIds: string[] = [];
    for (const week of currentPlanJson.weeks) {
      for (const day of week.days) {
        if (day.type === "workout" && day.workout_id) {
          workoutIds.push(day.workout_id);
        }
      }
    }

    // Fetch workout sessions for these workouts
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("*")
      .eq("user_id", userId)
      .in("workout_id", workoutIds);

    const workoutSessions = (sessions || []) as WorkoutSession[];
    const plannedWorkouts = workoutIds.length;
    
    // Analyze performance
    const analysis = analyzePerformance(workoutSessions, plannedWorkouts);
    const currentBlockNumber = currentPlanJson.block_number || 1;

    console.log("=== NEXT BLOCK GENERATION ===");
    console.log("User ID:", userId);
    console.log("Current block:", currentBlockNumber);
    console.log("New block number:", newBlockNumber);
    console.log("Adherence rate:", analysis.adherence_rate);
    console.log("Progression recommendation:", analysis.progression_recommendation);
    console.log("User feedback:", userFeedback);

    // Adjust recommendation based on user feedback
    let finalRecommendation = analysis.progression_recommendation;
    if (userFeedback === "too_hard") {
      finalRecommendation = "decrease";
    } else if (userFeedback === "too_easy" && analysis.adherence_rate >= 0.7) {
      finalRecommendation = "increase";
    }

    // Build prompts for AI
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildProgressionPrompt(
      userProfile,
      currentPlanJson,
      analysis,
      finalRecommendation,
      userFeedback,
      newBlockNumber,
      workoutDays
    );

    console.log("Calling AI for next block generation...");

    // Call Lovable AI - with retry logic
    let aiData;
    let retryCount = 0;
    const maxRetries = 1;

    while (retryCount <= maxRetries) {
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
                description: "Create a progressive 4-week training block based on previous performance",
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
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await aiResponse.text();
        console.error("AI API error:", aiResponse.status, errorText);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log("Retrying AI call...");
          continue;
        }
        throw new Error(`AI API error: ${aiResponse.status}`);
      }

      aiData = await aiResponse.json();
      break;
    }

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    let generatedData;
    try {
      generatedData = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Invalid JSON in AI response");
    }

    const { plan: planMeta, workouts: generatedWorkouts } = generatedData;

    // Validate generated data
    if (!planMeta || !generatedWorkouts || !Array.isArray(generatedWorkouts)) {
      throw new Error("Invalid AI response structure");
    }

    console.log("AI generated", generatedWorkouts.length, "workouts for block", newBlockNumber);

    // Build the plan structure
    const finalWeeks: PlanWeek[] = [];
    
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      const weekDays: PlanDay[] = [];
      
      for (const dayName of ALL_DAYS) {
        if (workoutDays.includes(dayName)) {
          const genWorkout = generatedWorkouts.find(
            (w: { week_number: number; day_name: string }) => 
              w.week_number === weekNum && w.day_name === dayName
          );
          
          weekDays.push({
            day_name: dayName,
            type: "workout",
            focus: genWorkout?.focus || "Training",
            workout_id: "",
          });
        } else {
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

    // Create plan record (keep old plan for history)
    const planJson: PlanJson = {
      block_number: newBlockNumber,
      weeks: finalWeeks,
      progression_strategy: planMeta.progression_strategy,
      progression_notes: planMeta.progression_notes,
      coach_notes: planMeta.coach_notes,
    };

    const { data: newPlan, error: newPlanError } = await supabase
      .from("plans")
      .insert({
        user_id: userId,
        name: `Training Block ${newBlockNumber}`,
        start_date: newStartDateStr,
        weeks: 4,
        plan_json: planJson,
      })
      .select()
      .single();

    if (newPlanError || !newPlan) {
      console.error("Failed to create plan:", newPlanError);
      throw new Error("Failed to create plan record");
    }

    // Insert workouts
    const workoutInserts: Array<{
      user_id: string;
      plan_id: string;
      title: string;
      scheduled_date: string;
      workout_json: WorkoutJson;
    }> = [];

    for (const genWorkout of generatedWorkouts) {
      if (!workoutDays.includes(genWorkout.day_name)) {
        continue;
      }

      const scheduledDate = calculateScheduledDate(newStartDate, genWorkout.week_number, genWorkout.day_name);
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

    const { data: insertedWorkouts, error: workoutsError } = await supabase
      .from("workouts")
      .insert(workoutInserts)
      .select();

    if (workoutsError) {
      console.error("Failed to insert workouts:", workoutsError);
      throw new Error("Failed to create workout records");
    }

    // Build workout ID map
    const workoutIdMap = new Map<string, string>();
    for (const workout of insertedWorkouts || []) {
      workoutIdMap.set(workout.scheduled_date, workout.id);
    }

    // Update plan_json with workout IDs
    for (const week of finalWeeks) {
      for (const day of week.days) {
        if (day.type === "workout") {
          const scheduledDate = calculateScheduledDate(newStartDate, week.week_number, day.day_name);
          const scheduledDateStr = scheduledDate.toISOString().split("T")[0];
          day.workout_id = workoutIdMap.get(scheduledDateStr) || "";
        }
      }
    }

    const completePlanJson: PlanJson = {
      ...planJson,
      weeks: finalWeeks,
    };

    await supabase
      .from("plans")
      .update({ plan_json: completePlanJson })
      .eq("id", newPlan.id);

    console.log("=== NEXT BLOCK GENERATION COMPLETE ===");

    return new Response(
      JSON.stringify({
        success: true,
        plan_id: newPlan.id,
        block_number: newBlockNumber,
        start_date: newStartDateStr,
        workouts_created: insertedWorkouts?.length || 0,
        analysis: {
          adherence_rate: analysis.adherence_rate,
          progression_applied: finalRecommendation,
        },
        message: `Block ${newBlockNumber} is ready! Your training continues on ${newStartDateStr}.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating next block:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildSystemPrompt(): string {
  return `You are an expert fitness coach creating the NEXT progressive training block.

CRITICAL RULES:
1. This is a CONTINUATION block - build on the previous block's foundation
2. Apply progressive overload based on performance data provided
3. ONLY create workouts for the specified workout_days
4. Keep session duration within the specified limit
5. Respect all equipment and injury constraints
6. Progress ONLY ONE variable per exercise (load OR reps OR sets, not multiple)
7. Never increase load by more than 5%

PROGRESSION STRATEGIES:
- "increase": Add 2.5-5% load OR +1-2 reps OR +1 set on main lifts
- "maintain": Keep similar structure, vary exercise selection or tempo
- "decrease": Start with deload week (reduce volume 20%), then rebuild

BLOCK STRUCTURE:
- Week 1: Adaptation/deload if needed, establish new baseline
- Week 2: Build phase, moderate intensity
- Week 3: Peak phase, highest intensity
- Week 4: Deload/testing, reduce volume for recovery

Generate encouraging, specific coach notes that reference the user's progress.`;
}

function buildProgressionPrompt(
  profile: UserProfile,
  previousPlan: PlanJson,
  analysis: PerformanceAnalysis,
  recommendation: "increase" | "maintain" | "decrease",
  userFeedback: string | null,
  newBlockNumber: number,
  workoutDays: string[]
): string {
  const equipment = profile.equipment_json || ["bodyweight"];
  const constraints = profile.constraints_json || {};
  const injuries = constraints.injury_flags || [];

  let feedbackNote = "";
  if (userFeedback) {
    const feedbackMap: Record<string, string> = {
      too_easy: "User reported the previous block was TOO EASY - consider more aggressive progression",
      just_right: "User reported the previous block was JUST RIGHT - maintain progression pace",
      too_hard: "User reported the previous block was TOO HARD - include deload and reduce intensity",
    };
    feedbackNote = feedbackMap[userFeedback] || "";
  }

  let injuryWarnings = "";
  if (injuries.length > 0) {
    injuryWarnings = `
INJURY RESTRICTIONS (MUST AVOID):
${injuries.map(i => `- ${i}`).join("\n")}`;
  }

  const topExercises = analysis.exercise_summaries
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5)
    .map(e => `- ${e.name}: performed ${e.frequency}x${e.avg_weight ? `, avg weight: ${e.avg_weight.toFixed(1)}kg` : ""}`)
    .join("\n");

  return `Create Block ${newBlockNumber} (Weeks ${(newBlockNumber - 1) * 4 + 1}-${newBlockNumber * 4}) based on previous performance.

PREVIOUS BLOCK SUMMARY:
- Block number: ${previousPlan.block_number}
- Progression strategy used: ${previousPlan.progression_strategy}
- Previous notes: ${previousPlan.progression_notes}

PERFORMANCE ANALYSIS:
- Adherence rate: ${Math.round(analysis.adherence_rate * 100)}%
- Completed workouts: ${analysis.completed_workouts} of ${analysis.planned_workouts}
- Fatigue signal: ${analysis.fatigue_signal}
- Recommended progression: ${recommendation.toUpperCase()}
${feedbackNote ? `\nUSER FEEDBACK: ${feedbackNote}` : ""}

TOP EXERCISES PERFORMED:
${topExercises || "- No exercise data available"}

USER PROFILE:
- Primary Goal: ${profile.goal_primary || "maintenance"}
- Secondary Goal: ${profile.goal_secondary || "none"}
- Experience: ${profile.experience_level || "beginner"}
- Session duration: ${profile.session_minutes || 45} minutes
- Available equipment: ${equipment.join(", ")}
${injuryWarnings}

STRICT WORKOUT DAYS (${workoutDays.length} days/week):
${workoutDays.map((d, i) => `${i + 1}. ${d}`).join("\n")}

GENERATE ${workoutDays.length * 4} TOTAL WORKOUTS (${workoutDays.length} per week × 4 weeks).

Apply "${recommendation}" progression strategy:
${recommendation === "increase" ? "- Increase intensity: +2.5-5% load OR +1-2 reps OR +1 set on main lifts" : ""}
${recommendation === "maintain" ? "- Maintain intensity, vary exercise selection or tempo for novelty" : ""}
${recommendation === "decrease" ? "- Week 1 is DELOAD (reduce volume 20%), then rebuild weeks 2-4" : ""}

Set block_number to ${newBlockNumber}.`;
}
