import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserProfile {
  id: string;
  workout_days: string[] | null;
  workout_time_preferences_json: {
    default_time?: string;
    buffer_minutes?: number;
    fallback_duration_minutes?: number;
  } | null;
  notification_types_json: string[] | null;
  notifications_enabled: boolean | null;
  subscription_status: string | null;
  trial_end_date: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use 'any' type to avoid strict typing issues with edge function context
    const supabase = createClient(supabaseUrl, serviceRoleKey) as any;

    const now = new Date();
    const results = {
      workout_reminders: 0,
      trial_reminders: 0,
      errors: [] as string[],
    };

    // Fetch users with notifications enabled
    const { data: users, error: usersError } = await supabase
      .from("users_profile")
      .select("id, workout_days, workout_time_preferences_json, notification_types_json, notifications_enabled, subscription_status, trial_end_date")
      .eq("notifications_enabled", true);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    for (const user of (users as UserProfile[]) || []) {
      const notificationTypes = user.notification_types_json || [];

      // 1. Schedule workout reminders
      if (notificationTypes.includes("workout_reminders") && user.workout_days && user.workout_time_preferences_json) {
        try {
          const scheduled = await scheduleWorkoutReminder(supabase, user, now);
          results.workout_reminders += scheduled;
        } catch (e: unknown) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          results.errors.push(`Workout reminder error for ${user.id}: ${errorMsg}`);
        }
      }

      // 2. Schedule trial reminders
      if (
        notificationTypes.includes("trial_reminders") &&
        user.subscription_status === "trialing" &&
        user.trial_end_date
      ) {
        try {
          const scheduled = await scheduleTrialReminders(supabase, user, now);
          results.trial_reminders += scheduled;
        } catch (e: unknown) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          results.errors.push(`Trial reminder error for ${user.id}: ${errorMsg}`);
        }
      }
    }

    // Track analytics for scheduled notifications
    if (results.workout_reminders > 0 || results.trial_reminders > 0) {
      await supabase.from("analytics_events").insert({
        user_id: "00000000-0000-0000-0000-000000000000", // System event
        event_name: "notifications_batch_scheduled",
        properties: {
          workout_reminders: results.workout_reminders,
          trial_reminders: results.trial_reminders,
          timestamp: now.toISOString(),
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Schedule notifications error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function scheduleWorkoutReminder(
  supabase: any,
  user: UserProfile,
  now: Date
): Promise<number> {
  const workoutDays = user.workout_days || [];
  const preferences = user.workout_time_preferences_json || {};
  const defaultTime = preferences.default_time || "09:00";

  // Get day names
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[now.getDay()];
  const tomorrowName = dayNames[(now.getDay() + 1) % 7];

  let scheduledCount = 0;

  // Check today and tomorrow for upcoming workouts
  for (const checkDay of [{ name: todayName, offset: 0 }, { name: tomorrowName, offset: 1 }]) {
    if (!workoutDays.includes(checkDay.name)) continue;

    // Calculate workout time
    const [hours, minutes] = defaultTime.split(":").map(Number);
    const workoutTime = new Date(now);
    workoutTime.setDate(workoutTime.getDate() + checkDay.offset);
    workoutTime.setHours(hours, minutes, 0, 0);

    // Schedule reminder 30 minutes before
    const reminderTime = new Date(workoutTime.getTime() - 30 * 60 * 1000);

    // Only schedule if reminder time is in the future (within next 48 hours)
    if (reminderTime > now && reminderTime.getTime() - now.getTime() < 48 * 60 * 60 * 1000) {
      // Check if already scheduled
      const { data: existing } = await supabase
        .from("notifications_log")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "workout_reminders")
        .gte("scheduled_for", reminderTime.toISOString())
        .lt("scheduled_for", new Date(reminderTime.getTime() + 60000).toISOString())
        .single();

      if (!existing) {
        const { error } = await supabase.from("notifications_log").insert({
          user_id: user.id,
          type: "workout_reminders",
          title: "Time to get ready! 💪",
          body: `Your ${checkDay.name} workout starts in 30 minutes. Let's crush it!`,
          scheduled_for: reminderTime.toISOString(),
          status: "scheduled",
        });

        if (!error) {
          scheduledCount++;
          
          // Track individual notification scheduled
          await supabase.from("analytics_events").insert({
            user_id: user.id,
            event_name: "notification_scheduled",
            properties: { type: "workout_reminders" },
          });
        }
      }
    }
  }

  return scheduledCount;
}

async function scheduleTrialReminders(
  supabase: any,
  user: UserProfile,
  now: Date
): Promise<number> {
  const trialEnd = new Date(user.trial_end_date!);
  let scheduledCount = 0;

  const reminders = [
    { hours: 48, title: "2 days left on your trial ⏰", body: "Your BisaFit trial ends in 2 days. Subscribe now to keep your personalized workouts and nutrition plans." },
    { hours: 24, title: "Last day of your trial! 🏃", body: "Your trial ends tomorrow. Don't lose access to your workout plans and progress tracking." },
  ];

  for (const reminder of reminders) {
    const reminderTime = new Date(trialEnd.getTime() - reminder.hours * 60 * 60 * 1000);

    // Only schedule if reminder time is in the future
    if (reminderTime > now) {
      // Check if already scheduled (within 1 hour window to avoid duplicates)
      const windowStart = new Date(reminderTime.getTime() - 30 * 60 * 1000);
      const windowEnd = new Date(reminderTime.getTime() + 30 * 60 * 1000);

      const { data: existing } = await supabase
        .from("notifications_log")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "trial_reminders")
        .gte("scheduled_for", windowStart.toISOString())
        .lte("scheduled_for", windowEnd.toISOString())
        .single();

      if (!existing) {
        const { error } = await supabase.from("notifications_log").insert({
          user_id: user.id,
          type: "trial_reminders",
          title: reminder.title,
          body: reminder.body,
          scheduled_for: reminderTime.toISOString(),
          status: "scheduled",
        });

        if (!error) {
          scheduledCount++;
          
          // Track individual notification scheduled
          await supabase.from("analytics_events").insert({
            user_id: user.id,
            event_name: "notification_scheduled",
            properties: { type: "trial_reminders" },
          });
        }
      }
    }
  }

  return scheduledCount;
}
