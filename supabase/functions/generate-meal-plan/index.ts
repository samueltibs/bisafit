import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Meal {
  name: string;
  recipe_title: string;
  ingredients: string[];
  instructions: string;
  protein_g_est: number;
  calories_est: number;
  cuisine_style?: string;
}

interface DayPlan {
  day: string;
  meals: Meal[];
  snacks: Meal[];
}

interface GroceryList {
  produce: string[];
  proteins: string[];
  pantry: string[];
  dairy_optional: string[];
}

interface MealPlan {
  days: DayPlan[];
  grocery_list: GroceryList;
  prep_tips: string[];
  swap_rules: string;
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

    const { days = 7, ingredients, weekCuisineTheme } = await req.json().catch(() => ({ days: 7, ingredients: null, weekCuisineTheme: null }));

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

    // Fetch nutrition profile with targets
    const { data: nutritionProfile, error: nutritionError } = await supabaseClient
      .from("nutrition_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (nutritionError || !nutritionProfile) {
      return new Response(JSON.stringify({ error: "Nutrition profile not found. Generate targets first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targets = nutritionProfile.targets_json as {
      calories_target?: { low: number; high: number };
      protein_g?: number;
    } | null;

    if (!targets) {
      return new Response(JSON.stringify({ error: "Nutrition targets not set. Generate targets first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dietaryPreferences = nutritionProfile.dietary_preferences_json || {};
    const cuisinePreferences = nutritionProfile.cuisine_preferences_json || [];
    const mealsPerDay = nutritionProfile.meals_per_day || 3;
    const snacksPerDay = nutritionProfile.snacks_per_day || 1;
    const budgetLevel = nutritionProfile.budget_level || "medium";

    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const requestedDays = dayNames.slice(0, Math.min(days, 7));

    // Determine active cuisine theme
    const activeCuisine = weekCuisineTheme || (cuisinePreferences.length > 0 ? cuisinePreferences[0] : null);
    
    const cuisineInstructions = activeCuisine
      ? `CUISINE THEME: "${activeCuisine}"
- Prefer recipes aligned with ${activeCuisine} cuisine
- If perfect alignment is not possible, generate "${activeCuisine}-inspired" or "${activeCuisine}-style" meals
- Add "cuisine_style" field to each meal (e.g., "Indian", "Indian-inspired", or null if no theme)
- NEVER fail generation due to cuisine mismatch - always provide meals
- Dietary restrictions and nutrition targets take priority over cuisine theme`
      : `CUISINE: No specific theme. Use variety based on user's general cuisine preferences: ${JSON.stringify(cuisinePreferences)}`;

    const ingredientInstructions = ingredients && Array.isArray(ingredients) && ingredients.length > 0
      ? `PRIORITY INGREDIENTS: Use these ingredients first: ${ingredients.join(", ")}
- Build meals primarily around these available ingredients
- Allow up to 3 common staples if needed (oil, spices, etc.)`
      : "";

    const systemPrompt = `You are a nutrition expert creating meal plans. Generate practical, delicious meals that meet nutritional targets.

CRITICAL RULES:
1. STRICTLY respect dietary restrictions (allergies, vegetarian, vegan, halal, etc.) - NEVER violate these
2. Match the calorie and protein targets
3. Keep recipes simple and practical
4. Consider budget level for ingredient choices
5. Return ONLY valid JSON, no markdown
6. Cuisine preferences are FLEXIBLE - never fail due to cuisine mismatch

${cuisineInstructions}

MEAL STRUCTURE:
- Each meal needs: name, recipe_title, ingredients (array), instructions (brief), protein_g_est, calories_est, cuisine_style (optional)
- Distribute calories across meals appropriately
- Include variety across the week`;

    const userPrompt = `Generate a ${days}-day meal plan:

TARGETS:
- Daily Calories: ${targets.calories_target?.low || 1800}–${targets.calories_target?.high || 2200} kcal
- Daily Protein: ${targets.protein_g || 100}g

PREFERENCES:
- Dietary Restrictions: ${JSON.stringify(dietaryPreferences)}
- Meals Per Day: ${mealsPerDay}
- Snacks Per Day: ${snacksPerDay}
- Budget Level: ${budgetLevel}

${ingredientInstructions}

DAYS TO PLAN: ${requestedDays.join(", ")}

Return ONLY this JSON structure:
{
  "days": [
    {
      "day": "Monday",
      "meals": [
        { "name": "Breakfast", "recipe_title": "...", "ingredients": ["..."], "instructions": "...", "protein_g_est": 35, "calories_est": 550, "cuisine_style": "Indian-inspired" }
      ],
      "snacks": [
        { "name": "Snack 1", "recipe_title": "...", "ingredients": ["..."], "instructions": "...", "protein_g_est": 10, "calories_est": 150, "cuisine_style": null }
      ]
    }
  ],
  "grocery_list": {
    "produce": ["..."],
    "proteins": ["..."],
    "pantry": ["..."],
    "dairy_optional": ["..."]
  },
  "prep_tips": ["..."],
  "swap_rules": "How to swap meals while keeping targets"
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
        temperature: 0.5,
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

    let mealPlan: MealPlan;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      mealPlan = JSON.parse(jsonMatch[0]);
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
          mealPlan = JSON.parse(retryJsonMatch[0]);
        } else {
          throw new Error("Failed to parse JSON after retry");
        }
      } else {
        throw new Error("Failed to repair JSON");
      }
    }

    // Validate structure
    if (!mealPlan.days || !Array.isArray(mealPlan.days)) {
      mealPlan.days = [];
    }
    if (!mealPlan.grocery_list) {
      mealPlan.grocery_list = { produce: [], proteins: [], pantry: [], dairy_optional: [] };
    }
    if (!mealPlan.prep_tips) {
      mealPlan.prep_tips = [];
    }
    if (!mealPlan.swap_rules) {
      mealPlan.swap_rules = "Swap meals with similar calorie and protein content.";
    }

    // Store meal plan
    const { error: updateError } = await supabaseClient
      .from("nutrition_profiles")
      .update({ meal_plan_json: mealPlan })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to store meal plan:", updateError);
    }

    return new Response(JSON.stringify({ success: true, mealPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-meal-plan error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
