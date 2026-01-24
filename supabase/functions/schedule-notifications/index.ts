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
    const results = { workout_reminders: 0, trial_reminders: 0, errors: [] as string[] };

    const { data: users, error: usersError } = await supabase
      .from("users_profile")
      .select("id, workout_days, workout_time_preferences_json, notification_types_json, notifications_enabled, subscription_status, trial_end_date, full_name")
      .eq("notifications_enabled", true);

    if (usersError) throw new Error(`Failed to fetch users: ${usersError.message}`);

    for (const user of (users as UserProfile[]) || []) {
      const notificationTypes = user.notification_types_json || [];

      if (notificationTypes.includes("workout_reminders") && user.workout_days && user.workout_time_preferences_json) {
        const scheduled = await scheduleWorkoutReminder(supabase, user, now);
        results.workout_reminders += scheduled;
      }

      if (notificationTypes.includes("trial_reminders") && user.subscription_status === "trialing" && user.trial_end_date) {
        const scheduled = await scheduleTrialReminders(supabase, user, now);
        results.trial_reminders += scheduled;
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

async function scheduleWorkoutReminder(supabase: any, user: UserProfile, now: Date): Promise<number> {
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
      const { data: existing } = await supabase
        .from("notifications_log")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "workout_reminders")
        .gte("scheduled_for", reminderTime.toISOString())
        .lt("scheduled_for", new Date(reminderTime.getTime() + 60000).toISOString())
        .maybeSingle();

      if (!existing) {
        await supabase.from("notifications_log").insert({
          user_id: user.id,
          type: "workout_reminders",
          title: "Time to get ready! 💪",
          body: `Your ${checkDay.name} workout starts in 30 minutes.`,
          scheduled_for: reminderTime.toISOString(),
          status: "scheduled",
        });
        scheduledCount++;
      }
    }
  }
  return scheduledCount;
}

async function scheduleTrialReminders(supabase: any, user: UserProfile, now: Date): Promise<number> {
  const trialEnd = new Date(user.trial_end_date!);
  let scheduledCount = 0;

  const reminders = [
    { hours: 48, title: "2 days left on your trial ⏰", body: "Your BisaFit trial ends in 2 days. Subscribe to keep access." },
    { hours: 24, title: "Last day of your trial! 🏃", body: "Your trial ends tomorrow. Don't lose your workout plans!" },
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

      if (!existing) {
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
