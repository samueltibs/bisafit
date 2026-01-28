import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { dayIndex, mealIndex, isSnack = false } = await req.json();

    if (dayIndex === undefined || mealIndex === undefined) {
      return new Response(JSON.stringify({ error: "dayIndex and mealIndex required" }), {
        status: 400,
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

    // Fetch nutrition profile
    const { data: nutritionProfile, error: nutritionError } = await supabaseClient
      .from("nutrition_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (nutritionError || !nutritionProfile) {
      return new Response(JSON.stringify({ error: "Nutrition profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mealPlan = nutritionProfile.meal_plan_json as {
      days?: Array<{
        day: string;
        meals: Array<{ name: string; recipe_title: string; ingredients: string[]; instructions: string; protein_g_est: number; calories_est: number }>;
        snacks: Array<{ name: string; recipe_title: string; ingredients: string[]; instructions: string; protein_g_est: number; calories_est: number }>;
      }>;
    } | null;

    if (!mealPlan?.days || !mealPlan.days[dayIndex]) {
      return new Response(JSON.stringify({ error: "Meal plan not found or invalid day" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const day = mealPlan.days[dayIndex];
    const currentMeal = isSnack ? day.snacks?.[mealIndex] : day.meals?.[mealIndex];

    if (!currentMeal) {
      return new Response(JSON.stringify({ error: "Meal not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targets = nutritionProfile.targets_json as {
      calories_target?: { low: number; high: number };
      protein_g?: number;
    } | null;

    const dietaryPreferences = nutritionProfile.dietary_preferences_json || {};
    const cuisinePreferences = nutritionProfile.cuisine_preferences_json || [];

    const systemPrompt = `You are a nutrition expert. Generate ONE alternative meal that matches the same nutritional targets.

RULES:
1. STRICTLY respect dietary restrictions
2. Match similar calorie and protein content
3. Include detailed step-by-step instructions (8-15 steps)
4. Include gourmet_notes with chef tips and variations
5. Return ONLY valid JSON`;

    const userPrompt = `Generate an alternative for this meal:

CURRENT MEAL:
- Name: ${currentMeal.name}
- Recipe: ${currentMeal.recipe_title}
- Calories: ${currentMeal.calories_est}
- Protein: ${currentMeal.protein_g_est}g

DIETARY RESTRICTIONS: ${JSON.stringify(dietaryPreferences)}
CUISINE PREFERENCES: ${JSON.stringify(cuisinePreferences)}

Return ONLY this JSON:
{
  "name": "${currentMeal.name}",
  "recipe_title": "...",
  "ingredients": ["ingredient with amount", ...],
  "instructions": "Brief 3-5 step summary...",
  "detailed_instructions": ["Step 1: ...", "Step 2: ...", ...],
  "protein_g_est": <similar to ${currentMeal.protein_g_est}>,
  "calories_est": <similar to ${currentMeal.calories_est}>,
  "prep_time_minutes": <number>,
  "cook_time_minutes": <number>,
  "servings": 1,
  "meal_prep_notes": "Storage and reheating tips...",
  "gourmet_notes": "Chef tips, technique variations, plating ideas..."
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
        temperature: 0.6,
      }),
    });

    if (!aiResponse.ok) {
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

    let newMeal;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      newMeal = JSON.parse(jsonMatch[0]);
    } catch {
      return new Response(JSON.stringify({ error: "Failed to generate alternative" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the meal plan
    if (isSnack) {
      mealPlan.days[dayIndex].snacks[mealIndex] = newMeal;
    } else {
      mealPlan.days[dayIndex].meals[mealIndex] = newMeal;
    }

    const { error: updateError } = await supabaseClient
      .from("nutrition_profiles")
      .update({ meal_plan_json: mealPlan })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update meal plan:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save swap" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, newMeal, updatedMealPlan: mealPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("swap-meal error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
