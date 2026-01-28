import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WeeklyStats {
  workoutsCompleted: number;
  workoutsPlanned: number;
  currentStreak: number;
  longestStreak: number;
  activeMinutesThisWeek: number;
  activeMinutesLastWeek: number;
  strengthWins: Array<{ exercise: string; type: string; improvement: string }>;
  personalBests: Array<{ exercise: string; metric: string }>;
  avgEnergyLevel: number | null;
  energyTrend: "up" | "down" | "steady" | null;
  stepsThisWeek: number | null;
  bestStepDay: { day: string; steps: number } | null;
}

interface WeeklySummary {
  headline: string;
  bullets: string[];
  badgeLine: string;
  nextSuggestion: string;
}

// Get start and end of week (Monday to Sunday)
function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Format date for display
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
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

    // Verify auth
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
    
    // Parse request body for optional week override
    let targetWeekDate = new Date();
    try {
      const body = await req.json();
      if (body.weekDate) {
        targetWeekDate = new Date(body.weekDate);
      }
    } catch {
      // Use current week
    }

    const { start: weekStart, end: weekEnd } = getWeekBounds(targetWeekDate);
    const weekStartStr = formatDate(weekStart);
    const weekEndStr = formatDate(weekEnd);

    console.log(`Generating story for week: ${weekStartStr} to ${weekEndStr}`);

    // Check if we already have a summary for this week
    const { data: existingSummary } = await supabase
      .from("weekly_summaries")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start_date", weekStartStr)
      .maybeSingle();

    // Get user profile
    const { data: profile } = await supabase
      .from("users_profile")
      .select("full_name, workout_days, longest_streak, coach_tone")
      .eq("id", userId)
      .single();

    const workoutDays = Array.isArray(profile?.workout_days) ? profile.workout_days.length : 4;
    const firstName = profile?.full_name?.split(' ')[0] || '';

    // Collect stats for this week
    const stats = await collectWeeklyStats(supabase, userId, weekStart, weekEnd, workoutDays, profile?.longest_streak || 0);

    console.log("Collected stats:", JSON.stringify(stats, null, 2));

    // Generate the story using AI
    const story = await generateStoryWithAI(LOVABLE_API_KEY, stats, firstName, profile?.coach_tone || 'balanced');

    // Save to database (upsert)
    const summaryData = {
      user_id: userId,
      week_start_date: weekStartStr,
      week_end_date: weekEndStr,
      generated_at: new Date().toISOString(),
      headline: story.headline,
      bullets: story.bullets,
      badge_line: story.badgeLine,
      next_suggestion: story.nextSuggestion,
      stats_snapshot: stats,
    };

    const { data: savedSummary, error: saveError } = await supabase
      .from("weekly_summaries")
      .upsert(summaryData, { onConflict: 'user_id,week_start_date' })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving summary:", saveError);
      throw new Error("Failed to save weekly summary");
    }

    return new Response(JSON.stringify({ summary: savedSummary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating weekly story:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function collectWeeklyStats(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  weekStart: Date,
  weekEnd: Date,
  plannedWorkouts: number,
  longestStreak: number
): Promise<WeeklyStats> {
  const weekStartStr = formatDate(weekStart);
  const weekEndStr = formatDate(weekEnd);

  // Get previous week bounds for comparison
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekEnd);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
  const prevWeekStartStr = formatDate(prevWeekStart);
  const prevWeekEndStr = formatDate(prevWeekEnd);

  // Count completed workouts this week
  const { count: workoutsCompleted } = await supabase
    .from("workout_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", weekStart.toISOString())
    .lte("completed_at", weekEnd.toISOString());

  // Get current streak from daily_progress
  const { data: latestProgress } = await supabase
    .from("daily_progress")
    .select("current_streak, active_minutes")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentStreak = (latestProgress as { current_streak?: number })?.current_streak || 0;

  // Get active minutes this week
  const { data: weekProgress } = await supabase
    .from("daily_progress")
    .select("active_minutes, date")
    .eq("user_id", userId)
    .gte("date", weekStartStr)
    .lte("date", weekEndStr);

  const weekProgressArray = (weekProgress || []) as Array<{ active_minutes?: number; date: string }>;
  const activeMinutesThisWeek = weekProgressArray.reduce((sum, p) => sum + (p.active_minutes || 0), 0);

  // Get active minutes last week
  const { data: prevWeekProgress } = await supabase
    .from("daily_progress")
    .select("active_minutes")
    .eq("user_id", userId)
    .gte("date", prevWeekStartStr)
    .lte("date", prevWeekEndStr);

  const prevWeekProgressArray = (prevWeekProgress || []) as Array<{ active_minutes?: number }>;
  const activeMinutesLastWeek = prevWeekProgressArray.reduce((sum, p) => sum + (p.active_minutes || 0), 0);

  // Get personal bests achieved this week
  const { data: pbs } = await supabase
    .from("personal_bests")
    .select("exercise_name, max_weight_kg, max_reps, best_volume")
    .eq("user_id", userId)
    .gte("achieved_at", weekStart.toISOString())
    .lte("achieved_at", weekEnd.toISOString());

  interface PBRow { exercise_name: string; max_weight_kg?: number; max_reps?: number; best_volume?: number }
  const pbsArray = (pbs || []) as PBRow[];
  const personalBests = pbsArray.map(pb => ({
    exercise: pb.exercise_name,
    metric: pb.max_weight_kg ? `${pb.max_weight_kg}kg` : 
            pb.max_reps ? `${pb.max_reps} reps` : 
            pb.best_volume ? `${pb.best_volume} vol` : 'PR'
  }));

  // Get strength signals from daily_progress
  const strengthWins: Array<{ exercise: string; type: string; improvement: string }> = [];

  // Get energy levels this week
  const { data: energyData } = await supabase
    .from("daily_progress")
    .select("energy_level, date")
    .eq("user_id", userId)
    .gte("date", weekStartStr)
    .lte("date", weekEndStr)
    .not("energy_level", "is", null);

  let avgEnergyLevel: number | null = null;
  let energyTrend: "up" | "down" | "steady" | null = null;

  interface EnergyRow { energy_level: number; date: string }
  const energyArray = (energyData || []) as EnergyRow[];
  if (energyArray.length > 0) {
    const levels = energyArray.map(e => e.energy_level);
    avgEnergyLevel = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
    
    // Calculate trend (first half vs second half)
    if (levels.length >= 2) {
      const mid = Math.floor(levels.length / 2);
      const firstHalf = levels.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
      const secondHalf = levels.slice(mid).reduce((a, b) => a + b, 0) / (levels.length - mid);
      if (secondHalf > firstHalf + 0.5) energyTrend = "up";
      else if (secondHalf < firstHalf - 0.5) energyTrend = "down";
      else energyTrend = "steady";
    }
  }

  // Get workout logs for steps (from external sources like Apple Health)
  const { data: workoutLogs } = await supabase
    .from("workout_logs")
    .select("steps, start_time")
    .eq("user_id", userId)
    .gte("start_time", weekStart.toISOString())
    .lte("start_time", weekEnd.toISOString())
    .not("steps", "is", null);

  let stepsThisWeek: number | null = null;
  let bestStepDay: { day: string; steps: number } | null = null;

  interface LogRow { steps?: number; start_time: string }
  const logsArray = (workoutLogs || []) as LogRow[];
  if (logsArray.length > 0) {
    // Group by day and sum
    const stepsByDay: Record<string, number> = {};
    for (const log of logsArray) {
      const day = new Date(log.start_time).toLocaleDateString('en-US', { weekday: 'short' });
      stepsByDay[day] = (stepsByDay[day] || 0) + (log.steps || 0);
    }
    
    stepsThisWeek = Object.values(stepsByDay).reduce((a, b) => a + b, 0);
    
    const maxDay = Object.entries(stepsByDay).sort((a, b) => b[1] - a[1])[0];
    if (maxDay) {
      bestStepDay = { day: maxDay[0], steps: maxDay[1] };
    }
  }

  return {
    workoutsCompleted: workoutsCompleted || 0,
    workoutsPlanned: plannedWorkouts,
    currentStreak,
    longestStreak,
    activeMinutesThisWeek,
    activeMinutesLastWeek,
    strengthWins,
    personalBests,
    avgEnergyLevel,
    energyTrend,
    stepsThisWeek,
    bestStepDay,
  };
}

async function generateStoryWithAI(
  apiKey: string,
  stats: WeeklyStats,
  firstName: string,
  coachTone: string
): Promise<WeeklySummary> {
  const toneGuide = coachTone === 'gentle' 
    ? 'Be warm, nurturing, and supportive. Use phrases like "You did great", "Be proud of yourself".'
    : coachTone === 'direct'
    ? 'Be direct and motivating. Use phrases like "Strong work", "You showed up".'
    : 'Balance encouragement with directness. Be supportive but not overly soft.';

  const hasWorkouts = stats.workoutsCompleted > 0;
  const hasSteps = stats.stepsThisWeek !== null && stats.stepsThisWeek > 0;
  const hasEnergy = stats.avgEnergyLevel !== null;
  const hasPBs = stats.personalBests.length > 0;
  const activeMinutesImproved = stats.activeMinutesThisWeek > stats.activeMinutesLastWeek;

  const prompt = `Generate a weekly progress summary for a fitness app user. This is a "Progress Without the Scale" feature - NEVER mention weight, pounds, kilograms, or scale-related metrics.

USER DATA:
- Name: ${firstName || 'User'}
- Workouts completed: ${stats.workoutsCompleted}/${stats.workoutsPlanned} planned
- Current streak: ${stats.currentStreak} days
- Longest streak: ${stats.longestStreak} days
- Active minutes this week: ${stats.activeMinutesThisWeek}
- Active minutes last week: ${stats.activeMinutesLastWeek}
${hasPBs ? `- Personal bests this week: ${stats.personalBests.map(p => `${p.exercise} (${p.metric})`).join(', ')}` : ''}
${hasEnergy ? `- Average energy level: ${stats.avgEnergyLevel}/5, trend: ${stats.energyTrend}` : ''}
${hasSteps ? `- Steps this week: ${stats.stepsThisWeek}, best day: ${stats.bestStepDay?.day} (${stats.bestStepDay?.steps})` : ''}

TONE: ${toneGuide}

Generate JSON with exactly this structure:
{
  "headline": "A short motivational headline (5-8 words, e.g. 'This Week You Leveled Up' or 'Consistency Is Your Superpower')",
  "bullets": ["4-7 short bullet points highlighting achievements, ONLY include bullets for data we actually have"],
  "badgeLine": "A celebratory one-liner with emoji (e.g. '🔥 4 workouts. Strong week.')",
  "nextSuggestion": "One gentle, actionable suggestion for next week"
}

RULES:
- Focus on consistency, strength, endurance, energy - NOT weight
- If user did 0 workouts, be encouraging about starting fresh
- Only include bullets for metrics we have data for
- Use supportive language: "You showed up", "Your body is adapting", "Every rep counts"
- Keep bullets concise (under 15 words each)`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are a supportive fitness coach who focuses on non-scale victories. Always return valid JSON." },
        { role: "user", content: prompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_weekly_summary",
            description: "Generate a motivational weekly progress summary",
            parameters: {
              type: "object",
              properties: {
                headline: { type: "string" },
                bullets: { type: "array", items: { type: "string" } },
                badgeLine: { type: "string" },
                nextSuggestion: { type: "string" },
              },
              required: ["headline", "bullets", "badgeLine", "nextSuggestion"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "generate_weekly_summary" } },
    }),
  });

  if (!response.ok) {
    console.error("AI API error:", response.status);
    // Return fallback if AI fails
    return generateFallbackSummary(stats);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall) {
    return JSON.parse(toolCall.function.arguments);
  }

  // Fallback to text parsing
  const textContent = data.choices?.[0]?.message?.content;
  if (textContent) {
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fall through to fallback
    }
  }

  return generateFallbackSummary(stats);
}

function generateFallbackSummary(stats: WeeklyStats): WeeklySummary {
  const hasWorkouts = stats.workoutsCompleted > 0;
  
  if (!hasWorkouts) {
    return {
      headline: "A Fresh Start Awaits",
      bullets: [
        "This week is a blank canvas",
        "One workout can spark momentum",
        "Your body is ready when you are",
      ],
      badgeLine: "💪 Ready for a win? Let's get one.",
      nextSuggestion: "Start with just one short workout this week — consistency starts with one.",
    };
  }

  const bullets: string[] = [];
  
  bullets.push(`✅ ${stats.workoutsCompleted}/${stats.workoutsPlanned} workouts completed`);
  
  if (stats.currentStreak > 0) {
    bullets.push(`🔥 ${stats.currentStreak}-day streak going strong`);
  }
  
  if (stats.activeMinutesThisWeek > 0) {
    const change = stats.activeMinutesThisWeek - stats.activeMinutesLastWeek;
    if (change > 0) {
      bullets.push(`⏱️ ${stats.activeMinutesThisWeek} active minutes (+${change} from last week)`);
    } else {
      bullets.push(`⏱️ ${stats.activeMinutesThisWeek} active minutes this week`);
    }
  }
  
  if (stats.personalBests.length > 0) {
    bullets.push(`🏆 ${stats.personalBests.length} personal best${stats.personalBests.length > 1 ? 's' : ''} achieved`);
  }
  
  if (stats.avgEnergyLevel) {
    const energyEmoji = stats.avgEnergyLevel >= 4 ? '⚡' : stats.avgEnergyLevel >= 3 ? '😊' : '💤';
    const trendText = stats.energyTrend === 'up' ? 'trending up' : stats.energyTrend === 'down' ? 'trending down' : '';
    bullets.push(`${energyEmoji} Energy level: ${stats.avgEnergyLevel}/5 ${trendText}`.trim());
  }

  return {
    headline: stats.workoutsCompleted >= stats.workoutsPlanned 
      ? "You Crushed This Week" 
      : "Progress in Motion",
    bullets,
    badgeLine: `🔥 ${stats.workoutsCompleted} workout${stats.workoutsCompleted !== 1 ? 's' : ''}. You showed up.`,
    nextSuggestion: stats.workoutsCompleted < stats.workoutsPlanned
      ? "Try adding one 'Quick Win' workout to fill the gap."
      : "Keep the momentum — aim for the same consistency next week.",
  };
}
