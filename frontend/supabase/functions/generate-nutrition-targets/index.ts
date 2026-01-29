import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NutritionTargets {
  calories_target: { low: number; high: number };
  protein_g: number;
  carbs_g_optional?: number;
  fat_g_optional?: number;
  water_liters: number;
  notes: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("users_profile")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch nutrition profile
    const { data: nutritionProfile } = await supabaseClient
      .from("nutrition_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Build context for AI
    const weightKg = profile.weight_kg ? Number(profile.weight_kg) : null;
    const heightCm = profile.height_cm;
    const goalPrimary = profile.goal_primary || "general_fitness";
    const goalSecondary = profile.goal_secondary;
    const experienceLevel = profile.experience_level || "beginner";
    const workoutDays = profile.workout_days || [];
    const sessionMinutes = profile.session_minutes || 45;
    const gender = profile.gender;

    const dietaryPreferences = nutritionProfile?.dietary_preferences_json || {};
    const cuisinePreferences = nutritionProfile?.cuisine_preferences_json || [];
    const mealsPerDay = nutritionProfile?.meals_per_day || 3;
    const snacksPerDay = nutritionProfile?.snacks_per_day || 1;
    const nutritionGoalStyle = nutritionProfile?.nutrition_goal_style || "simple";

    const systemPrompt = `You are a nutrition expert assistant for a fitness app. You provide safe, evidence-based nutrition guidance.

IMPORTANT RULES:
1. Never recommend extreme calorie deficits (minimum 1200 kcal for women, 1500 kcal for men)
2. Protein recommendations should be based on body weight and goals
3. Always include a safety disclaimer
4. Return ONLY valid JSON, no markdown or explanations outside JSON

PROTEIN GUIDELINES (g/kg body weight):
- Fat loss: 1.6–2.2 g/kg
- Muscle gain: 1.8–2.2 g/kg  
- Endurance/maintenance: 1.4–1.8 g/kg

CALORIE ESTIMATION (if weight available):
- Base on activity level and goals
- Provide a range, not exact number
- Conservative estimates are safer`;

    const userPrompt = `Generate nutrition targets for this user:

USER PROFILE:
- Weight: ${weightKg ? `${weightKg} kg` : "Not provided"}
- Height: ${heightCm ? `${heightCm} cm` : "Not provided"}
- Gender: ${gender || "Not specified"}
- Primary Goal: ${goalPrimary}
- Secondary Goal: ${goalSecondary || "None"}
- Experience Level: ${experienceLevel}
- Workout Days Per Week: ${Array.isArray(workoutDays) ? workoutDays.length : 0}
- Session Duration: ${sessionMinutes} minutes

DIETARY INFO:
- Dietary Preferences: ${JSON.stringify(dietaryPreferences)}
- Cuisine Preferences: ${JSON.stringify(cuisinePreferences)}
- Meals Per Day: ${mealsPerDay}
- Snacks Per Day: ${snacksPerDay}
- Display Style: ${nutritionGoalStyle} (if "simple", only calories+protein needed; if "macros", include carbs/fat)

Return ONLY this JSON structure:
{
  "calories_target": { "low": <number>, "high": <number> },
  "protein_g": <number>,
  "carbs_g_optional": <number or null>,
  "fat_g_optional": <number or null>,
  "water_liters": <number>,
  "notes": "<short explanation + disclaimer that this is not medical advice>"
}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let targets: NutritionTargets;
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      targets = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      
      // Retry with repair prompt
      const retryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Fix this JSON and return ONLY valid JSON, nothing else." },
            { role: "user", content: `Fix this to valid JSON: ${content}` },
          ],
          temperature: 0.1,
        }),
      });

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        const retryContent = retryData.choices?.[0]?.message?.content || "";
        const retryJsonMatch = retryContent.match(/\{[\s\S]*\}/);
        if (retryJsonMatch) {
          targets = JSON.parse(retryJsonMatch[0]);
        } else {
          throw new Error("Failed to parse JSON after retry");
        }
      } else {
        throw new Error("Failed to repair JSON");
      }
    }

    // Validate and sanitize
    if (!targets.calories_target?.low || !targets.calories_target?.high) {
      targets.calories_target = { low: 1800, high: 2200 };
    }
    if (!targets.protein_g || targets.protein_g < 50) {
      targets.protein_g = weightKg ? Math.round(weightKg * 1.6) : 100;
    }
    if (!targets.water_liters) {
      targets.water_liters = 2.5;
    }
    if (!targets.notes) {
      targets.notes = "These are estimated targets. Consult a healthcare professional for personalized advice. This is not medical advice.";
    }

    // Store targets in nutrition_profiles
    const { error: upsertError } = await supabaseClient
      .from("nutrition_profiles")
      .upsert({
        user_id: user.id,
        targets_json: targets,
        calories_target: Math.round((targets.calories_target.low + targets.calories_target.high) / 2),
        protein_g: targets.protein_g,
        carbs_g: targets.carbs_g_optional || null,
        fat_g: targets.fat_g_optional || null,
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Failed to store targets:", upsertError);
    }

    return new Response(JSON.stringify({ success: true, targets }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-nutrition-targets error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
