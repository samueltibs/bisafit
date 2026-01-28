import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserProfile {
  id: string;
  full_name?: string;
  workout_days: string[] | null;
  workout_time_preferences_json: {
    default_time?: string;
  } | null;
  notification_types_json: string[] | null;
  notifications_enabled: boolean | null;
  subscription_status: string | null;
  trial_end_date: string | null;
  coach_tone: string | null;
}

interface WorkoutSession {
  completed_at: string | null;
  workouts: { scheduled_date: string | null } | null;
}

type CoachTone = 'gentle' | 'balanced' | 'direct';

// Tone-aware message templates
const SMART_MESSAGES = {
  time_based: {
    gentle: {
      title: "Your workout time is coming up 💪",
      body: "You mentioned you like working out around now — ready whenever you are.",
    },
    balanced: {
      title: "Workout time! 💪",
      body: "Your {day} workout starts in 30 minutes — ready?",
    },
    direct: {
      title: "Time to train 💪",
      body: "Workout in 30 min. Let's go.",
    },
  },
  adaptive_missed: {
    gentle: {
      title: "Still time today ✨",
      body: "No pressure — I can adjust your workout to fit a tighter schedule.",
    },
    balanced: {
      title: "Short on time? 🕐",
      body: "Quick Win workout available — same gains, half the time.",
    },
    direct: {
      title: "Quick Win available",
      body: "15-minute version ready. Same movement patterns.",
    },
  },
  adaptive_streak: {
    gentle: {
      title: "Checking in 🌟",
      body: "No pressure — let's just get one win today. Even 10 minutes counts.",
    },
    balanced: {
      title: "Let's get a win today",
      body: "Even a short session keeps your streak alive.",
    },
    direct: {
      title: "Get one in today",
      body: "10 minutes is all you need. Streak protection on.",
    },
  },
  context_late: {
    gentle: {
      title: "Late evening? No problem 🌙",
      body: "Even 10 minutes counts today. I've got a quick option ready.",
    },
    balanced: {
      title: "Still time for a quick win",
      body: "Even 10 minutes counts today.",
    },
    direct: {
      title: "10 minutes left in the day",
      body: "Quick session available. Streak saver.",
    },
  },
  celebration: {
    gentle: {
      title: "Look at you! 🎉",
      body: "{streak}-day streak! You're building something amazing.",
    },
    balanced: {
      title: "🔥 {streak}-day streak!",
      body: "That's discipline. Keep the momentum going.",
    },
    direct: {
      title: "🔥 {streak} days",
      body: "Solid consistency.",
    },
  },
};

function normalizeCoachTone(tone: string | null): CoachTone {
  if (tone === 'gentle' || tone === 'balanced' || tone === 'direct') {
    return tone;
  }
  return 'balanced';
}

// Track analytics event (fire and forget)
async function trackNotificationEvent(
  supabase: any, 
  userId: string, 
  eventName: string, 
  properties: Record<string, any>
) {
  try {
    await supabase.from("analytics_events").insert({
      user_id: userId,
      event_name: eventName,
      properties,
      platform: "backend",
    });
  } catch (e) {
    console.error("Failed to track event:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const results = { 
      workout_reminders: 0,
      smart_reminders: 0,
      meal_reminders: 0, 
      trial_reminders: 0,
      celebration_reminders: 0,
      errors: [] as string[] 
    };

    const { data: users, error: usersError } = await supabase
      .from("users_profile")
      .select("id, workout_days, workout_time_preferences_json, notification_types_json, notifications_enabled, subscription_status, trial_end_date, full_name, coach_tone")
      .eq("notifications_enabled", true);

    if (usersError) throw new Error(`Failed to fetch users: ${usersError.message}`);

    for (const user of (users as UserProfile[]) || []) {
      const notificationTypes = user.notification_types_json || [];
      const tone = normalizeCoachTone(user.coach_tone);

      // Standard workout reminders
      if (notificationTypes.includes("workout_reminders") && user.workout_days && user.workout_time_preferences_json) {
        const scheduled = await scheduleWorkoutReminder(supabase, user, now, tone);
        if (scheduled > 0) {
          await trackNotificationEvent(supabase, user.id, "notification_scheduled", { type: "workout_reminders", count: scheduled });
        }
        results.workout_reminders += scheduled;
      }

      // Smart/adaptive reminders
      if (notificationTypes.includes("smart_reminders") || notificationTypes.includes("workout_reminders")) {
        const smartScheduled = await scheduleSmartReminders(supabase, user, now, tone);
        if (smartScheduled > 0) {
          await trackNotificationEvent(supabase, user.id, "notification_scheduled", { type: "smart_reminders", count: smartScheduled });
        }
        results.smart_reminders += smartScheduled;
      }

      // Meal reminders (daily at 8am if enabled)
      if (notificationTypes.includes("meal_reminders")) {
        const scheduled = await scheduleMealReminder(supabase, user, now, tone);
        if (scheduled > 0) {
          await trackNotificationEvent(supabase, user.id, "notification_scheduled", { type: "meal_reminders", count: scheduled });
        }
        results.meal_reminders += scheduled;
      }

      // Trial reminders
      if (notificationTypes.includes("trial_reminders") && user.subscription_status === "trialing" && user.trial_end_date) {
        const scheduled = await scheduleTrialReminders(supabase, user, now);
        if (scheduled > 0) {
          await trackNotificationEvent(supabase, user.id, "notification_scheduled", { type: "trial_reminders", count: scheduled });
        }
        results.trial_reminders += scheduled;
      }

      // Streak celebration reminders
      if (notificationTypes.includes("streak_protection") || notificationTypes.includes("workout_reminders")) {
        const celebrationScheduled = await scheduleStreakCelebration(supabase, user, now, tone);
        if (celebrationScheduled > 0) {
          await trackNotificationEvent(supabase, user.id, "notification_scheduled", { type: "celebration", count: celebrationScheduled });
        }
        results.celebration_reminders += celebrationScheduled;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function scheduleWorkoutReminder(
  supabase: any, 
  user: UserProfile, 
  now: Date, 
  tone: CoachTone
): Promise<number> {
  const workoutDays = user.workout_days || [];
  const defaultTime = user.workout_time_preferences_json?.default_time || "09:00";
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let scheduledCount = 0;

  for (const checkDay of [{ name: dayNames[now.getDay()], offset: 0 }, { name: dayNames[(now.getDay() + 1) % 7], offset: 1 }]) {
    if (!workoutDays.includes(checkDay.name)) continue;

    const [hours, minutes] = defaultTime.split(":").map(Number);
    const workoutTime = new Date(now);
    workoutTime.setDate(workoutTime.getDate() + checkDay.offset);
    workoutTime.setHours(hours, minutes, 0, 0);

    const reminderTime = new Date(workoutTime.getTime() - 30 * 60 * 1000);

    if (reminderTime > now && reminderTime.getTime() - now.getTime() < 48 * 60 * 60 * 1000) {
      // Check if already completed today
      const todayStr = workoutTime.toISOString().split('T')[0];
      const { data: completedToday } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", user.id)
        .gte("completed_at", `${todayStr}T00:00:00`)
        .lt("completed_at", `${todayStr}T23:59:59`)
        .limit(1);

      if (completedToday && completedToday.length > 0) {
        continue; // Already worked out, skip reminder
      }

      const windowStart = new Date(reminderTime.getTime() - 60000);
      const windowEnd = new Date(reminderTime.getTime() + 60000);
      
      const { data: existing } = await supabase
        .from("notifications_log")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "workout_reminders")
        .gte("scheduled_for", windowStart.toISOString())
        .lt("scheduled_for", windowEnd.toISOString())
        .maybeSingle();

      const message = SMART_MESSAGES.time_based[tone];
      const title = message.title;
      const body = message.body.replace("{day}", checkDay.name);

      if (existing) {
        await supabase.from("notifications_log")
          .update({ title, body, scheduled_for: reminderTime.toISOString(), status: "scheduled" })
          .eq("id", existing.id);
      } else {
        await supabase.from("notifications_log").insert({
          user_id: user.id,
          type: "workout_reminders",
          title,
          body,
          scheduled_for: reminderTime.toISOString(),
          status: "scheduled",
        });
        scheduledCount++;
      }
    }
  }
  return scheduledCount;
}

async function scheduleSmartReminders(
  supabase: any,
  user: UserProfile,
  now: Date,
  tone: CoachTone
): Promise<number> {
  let scheduledCount = 0;
  const workoutDays = user.workout_days || [];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[now.getDay()];
  const isWorkoutDay = workoutDays.includes(todayName);

  // Get recent workout sessions
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentSessions } = await supabase
    .from("workout_sessions")
    .select("completed_at")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .gte("completed_at", sevenDaysAgo.toISOString())
    .order("completed_at", { ascending: false });

  // Calculate days since last workout
  let daysSinceLastWorkout = 7;
  if (recentSessions && recentSessions.length > 0) {
    const lastWorkout = new Date(recentSessions[0].completed_at);
    daysSinceLastWorkout = Math.floor((now.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Check if already completed today
  const todayStr = now.toISOString().split('T')[0];
  const { data: completedToday } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .gte("completed_at", `${todayStr}T00:00:00`)
    .lt("completed_at", `${todayStr}T23:59:59`)
    .limit(1);

  if (completedToday && completedToday.length > 0) {
    return 0; // Already worked out today
  }

  // Context-aware: Late evening reminder (after 8 PM on workout days)
  const currentHour = now.getHours();
  if (isWorkoutDay && currentHour >= 20 && currentHour < 22) {
    const reminderTime = new Date(now);
    reminderTime.setHours(20, 30, 0, 0);

    if (reminderTime > now || currentHour === 20) {
      const windowStart = new Date(reminderTime.getTime() - 30 * 60 * 1000);
      const windowEnd = new Date(reminderTime.getTime() + 30 * 60 * 1000);

      const { data: existing } = await supabase
        .from("notifications_log")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "smart_reminders")
        .gte("scheduled_for", windowStart.toISOString())
        .lt("scheduled_for", windowEnd.toISOString())
        .maybeSingle();

      if (!existing) {
        const message = SMART_MESSAGES.context_late[tone];
        await supabase.from("notifications_log").insert({
          user_id: user.id,
          type: "smart_reminders",
          title: message.title,
          body: message.body,
          scheduled_for: reminderTime.toISOString(),
          status: "scheduled",
        });
        scheduledCount++;
      }
    }
  }

  // Adaptive: Multiple days missed
  if (daysSinceLastWorkout >= 3) {
    const reminderTime = new Date(now);
    reminderTime.setHours(10, 0, 0, 0);

    if (reminderTime > now) {
      const windowStart = new Date(reminderTime.getTime() - 60 * 60 * 1000);
      const windowEnd = new Date(reminderTime.getTime() + 60 * 60 * 1000);

      const { data: existing } = await supabase
        .from("notifications_log")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "smart_reminders")
        .gte("scheduled_for", windowStart.toISOString())
        .lt("scheduled_for", windowEnd.toISOString())
        .maybeSingle();

      if (!existing) {
        const message = SMART_MESSAGES.adaptive_streak[tone];
        await supabase.from("notifications_log").insert({
          user_id: user.id,
          type: "smart_reminders",
          title: message.title,
          body: message.body,
          scheduled_for: reminderTime.toISOString(),
          status: "scheduled",
        });
        scheduledCount++;
      }
    }
  }

  return scheduledCount;
}

async function scheduleMealReminder(
  supabase: any, 
  user: UserProfile, 
  now: Date,
  tone: CoachTone
): Promise<number> {
  let scheduledCount = 0;

  for (const dayOffset of [0, 1]) {
    const reminderTime = new Date(now);
    reminderTime.setDate(reminderTime.getDate() + dayOffset);
    reminderTime.setHours(8, 0, 0, 0);

    if (reminderTime <= now) continue;

    const windowStart = new Date(reminderTime.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(reminderTime.getTime() + 30 * 60 * 1000);

    const { data: existing } = await supabase
      .from("notifications_log")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "meal_reminders")
      .gte("scheduled_for", windowStart.toISOString())
      .lte("scheduled_for", windowEnd.toISOString())
      .maybeSingle();

    const title = "Plan your meals today 🥗";
    const body = tone === 'gentle' 
      ? "Check your personalized meal plan when you're ready."
      : tone === 'direct'
        ? "Meal plan ready. Check it."
        : "Check your personalized meal plan and stay on track with your nutrition goals.";

    if (existing) {
      await supabase.from("notifications_log")
        .update({ title, body, scheduled_for: reminderTime.toISOString(), status: "scheduled" })
        .eq("id", existing.id);
    } else {
      await supabase.from("notifications_log").insert({
        user_id: user.id,
        type: "meal_reminders",
        title,
        body,
        scheduled_for: reminderTime.toISOString(),
        status: "scheduled",
      });
      scheduledCount++;
    }
  }

  return scheduledCount;
}

async function scheduleTrialReminders(supabase: any, user: UserProfile, now: Date): Promise<number> {
  const trialEnd = new Date(user.trial_end_date!);
  let scheduledCount = 0;

  const reminders = [
    { hours: 48, title: "2 days left on your trial ⏰", body: "Your BisaFit trial ends in 2 days. Continue your free trial to keep access." },
    { hours: 24, title: "Last day of your trial! 🏃", body: "Your trial ends tomorrow. Keep your personalized workout plans!" },
  ];

  for (const reminder of reminders) {
    const reminderTime = new Date(trialEnd.getTime() - reminder.hours * 60 * 60 * 1000);

    if (reminderTime > now) {
      const windowStart = new Date(reminderTime.getTime() - 30 * 60 * 1000);
      const windowEnd = new Date(reminderTime.getTime() + 30 * 60 * 1000);

      const { data: existing } = await supabase
        .from("notifications_log")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "trial_reminders")
        .gte("scheduled_for", windowStart.toISOString())
        .lte("scheduled_for", windowEnd.toISOString())
        .maybeSingle();

      if (existing) {
        await supabase.from("notifications_log")
          .update({ title: reminder.title, body: reminder.body, scheduled_for: reminderTime.toISOString(), status: "scheduled" })
          .eq("id", existing.id);
      } else {
        await supabase.from("notifications_log").insert({
          user_id: user.id,
          type: "trial_reminders",
          title: reminder.title,
          body: reminder.body,
          scheduled_for: reminderTime.toISOString(),
          status: "scheduled",
        });
        scheduledCount++;
      }
    }
  }
  return scheduledCount;
}

async function scheduleStreakCelebration(
  supabase: any,
  user: UserProfile,
  now: Date,
  tone: CoachTone
): Promise<number> {
  // Get current streak from daily_progress
  const todayStr = now.toISOString().split('T')[0];
  const { data: progressData } = await supabase
    .from("daily_progress")
    .select("current_streak")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1);

  const currentStreak = progressData?.[0]?.current_streak || 0;

  // Only celebrate milestone streaks
  const milestones = [7, 14, 21, 30, 50, 75, 100];
  if (!milestones.includes(currentStreak)) {
    return 0;
  }

  // Check if we already celebrated this streak
  const { data: existing } = await supabase
    .from("notifications_log")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "celebration")
    .gte("created_at", `${todayStr}T00:00:00`)
    .maybeSingle();

  if (existing) {
    return 0;
  }

  const message = SMART_MESSAGES.celebration[tone];
  const title = message.title.replace("{streak}", currentStreak.toString());
  const body = message.body.replace("{streak}", currentStreak.toString());

  await supabase.from("notifications_log").insert({
    user_id: user.id,
    type: "celebration",
    title,
    body,
    scheduled_for: now.toISOString(),
    status: "sent",
    sent_at: now.toISOString(),
  });

  return 1;
}
