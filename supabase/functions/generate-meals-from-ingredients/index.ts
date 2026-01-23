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
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ingredients, mode = 'flexible_prefer' } = await req.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(JSON.stringify({ error: "At least one ingredient is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isStrictMode = mode === 'strict_only';

    // Fetch nutrition profile and user profile
    const [nutritionResult, profileResult] = await Promise.all([
      supabase.from("nutrition_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("users_profile").select("goal_primary, goal_secondary, weight_kg").eq("id", user.id).single(),
    ]);

    const nutritionProfile = nutritionResult.data;
    const userProfile = profileResult.data;

    // Get targets or use defaults
    const targets = nutritionProfile?.targets_json || {
      calories_target: { low: 1800, high: 2200 },
      protein_g: 120,
    };

    const dietaryPrefs = nutritionProfile?.dietary_preferences_json || {};
    const cuisinePrefs = nutritionProfile?.cuisine_preferences_json || [];
    const mealsPerDay = nutritionProfile?.meals_per_day || 3;

    // Build allergy/dietary restrictions string
    const restrictions: string[] = [];
    if (dietaryPrefs.vegetarian) restrictions.push("vegetarian");
    if (dietaryPrefs.vegan) restrictions.push("vegan");
    if (dietaryPrefs.halal) restrictions.push("halal");
    if (dietaryPrefs.kosher) restrictions.push("kosher");
    if (dietaryPrefs.gluten_free) restrictions.push("gluten-free");
    if (dietaryPrefs.lactose_free) restrictions.push("lactose-free");
    if (dietaryPrefs.nut_free) restrictions.push("nut-free");
    if (dietaryPrefs.allergies) restrictions.push(`allergic to: ${dietaryPrefs.allergies}`);

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cuisineInstructions = cuisinePrefs.length > 0
      ? `CUISINE PREFERENCES: ${cuisinePrefs.join(", ")}
- Prefer recipes aligned with these cuisines when possible
- If perfect alignment is not possible, create "{Cuisine}-inspired" or "{Cuisine}-style" dishes
- Add "cuisine_style" field to each meal (e.g., "Thai", "Mexican-inspired", or null)
- NEVER fail generation due to cuisine mismatch - always provide meals
- Dietary restrictions take priority over cuisine preferences`
      : "";

    // Mode-specific instructions
    const modeInstructions = isStrictMode
      ? `MODE: STRICT - Use ONLY the provided ingredients
- Do NOT add any oils, spices, sauces, or staples that are not explicitly in the ingredient list
- If an ingredient is not in the list, do NOT use it
- Create simpler meals if needed - this is acceptable
- missing_optional array MUST be empty (no additions allowed)
- Add "is_strict_mode": true to each meal
- Include mode_note: "Strict mode enabled — using only what you have."`
      : `MODE: FLEXIBLE - Prefer provided ingredients, allow basics
- Prioritize using the provided ingredients first
- You may add UP TO 5 common staples/basics (oil, salt, pepper, garlic, onion, basic spices)
- Return all additions in a top-level "optional_additions" array
- These are suggestions only - the meal should still work without them
- Include mode_note: "Uses scanned ingredients + optional additions."`;

    const systemPrompt = `You are a nutrition-focused chef AI that creates healthy, practical meals from available ingredients.

Your task is to generate meal suggestions using the provided ingredients.

${modeInstructions}

User's Nutrition Targets:
- Calories: ${targets.calories_target?.low || 1800}-${targets.calories_target?.high || 2200} kcal/day
- Protein: ${targets.protein_g || 120}g/day
- Meals per day: ${mealsPerDay}

User's Goal: ${userProfile?.goal_primary || "general health"}

${restrictions.length > 0 ? `STRICT Dietary Restrictions (MUST follow): ${restrictions.join(", ")}` : "No specific dietary restrictions."}

${cuisineInstructions}

Guidelines:
- Create practical, quick meals (under 30 minutes prep when possible)
- Each meal should contribute meaningfully to protein targets
- Be realistic about portion sizes and calorie estimates
- If there aren't enough ingredients for complete meals, generate simpler meals - NEVER fail silently
- Do NOT suggest meals that violate dietary restrictions
- Cuisine preferences are flexible - never fail due to cuisine mismatch
- NEVER switch modes automatically - always respect the requested mode

You MUST respond with ONLY valid JSON in this exact format:
{
  "meals": [
    {
      "meal_name": "Lunch",
      "recipe_title": "Garlic Chicken & Spinach Skillet",
      "uses_ingredients": ["chicken breast", "spinach"],
      "missing_optional": ${isStrictMode ? '[]' : '["olive oil", "garlic"]'},
      "ingredients_with_amounts": ["1 lb chicken breast", "2 cups spinach"${isStrictMode ? '' : ', "1 tbsp olive oil", "2 cloves garlic"'}],
      "instructions": "Step by step cooking instructions...",
      "protein_g_est": 45,
      "calories_est": 550,
      "prep_time_minutes": 20,
      "cuisine_style": "Mediterranean-inspired",
      "is_strict_mode": ${isStrictMode}
    }
  ],
  ${isStrictMode ? '' : '"optional_additions": ["olive oil", "garlic", "salt", "pepper"],'}
  "leftover_tips": ["Store cooked chicken for up to 3 days", "Spinach can be added to eggs tomorrow"],
  "shopping_suggestions": ["Items that would complement these ingredients well"],
  "mode_note": "${isStrictMode ? 'Strict mode enabled — using only what you have.' : 'Uses scanned ingredients + optional additions.'}",
  "note": "Brief note about the meal suggestions"
}

Do not include any text before or after the JSON.`;

    const userPrompt = `Available ingredients: ${ingredients.join(", ")}

Please suggest ${Math.min(mealsPerDay, 3)} meal ideas using these ingredients. Prioritize protein-rich options that help meet the daily protein target.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let result;
    try {
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error, attempting repair...", parseError);

      const repairResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: "Fix this JSON and return ONLY valid JSON. No explanation.",
            },
            { role: "user", content: content },
          ],
          temperature: 0,
          max_tokens: 3000,
        }),
      });

      if (repairResponse.ok) {
        const repairResult = await repairResponse.json();
        let repairedContent = repairResult.choices?.[0]?.message?.content || "";
        repairedContent = repairedContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        result = JSON.parse(repairedContent);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    // Validate structure
    if (!result.meals || !Array.isArray(result.meals)) {
      return new Response(JSON.stringify({ 
        error: "Not enough ingredients detected. Try another photo or add items manually.",
        meals: [],
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure each meal has required fields
    result.meals = result.meals.map((meal: Record<string, unknown>) => ({
      meal_name: meal.meal_name || "Meal",
      recipe_title: meal.recipe_title || "Recipe",
      uses_ingredients: Array.isArray(meal.uses_ingredients) ? meal.uses_ingredients : [],
      missing_optional: isStrictMode ? [] : (Array.isArray(meal.missing_optional) ? meal.missing_optional : []),
      ingredients_with_amounts: Array.isArray(meal.ingredients_with_amounts) ? meal.ingredients_with_amounts : [],
      instructions: meal.instructions || "",
      protein_g_est: typeof meal.protein_g_est === "number" ? meal.protein_g_est : 0,
      calories_est: typeof meal.calories_est === "number" ? meal.calories_est : 0,
      prep_time_minutes: typeof meal.prep_time_minutes === "number" ? meal.prep_time_minutes : 30,
      is_strict_mode: isStrictMode,
    }));

    result.leftover_tips = Array.isArray(result.leftover_tips) ? result.leftover_tips : [];
    result.shopping_suggestions = Array.isArray(result.shopping_suggestions) ? result.shopping_suggestions : [];
    result.optional_additions = isStrictMode ? [] : (Array.isArray(result.optional_additions) ? result.optional_additions : []);
    result.mode_note = isStrictMode 
      ? "Strict mode enabled — using only what you have."
      : "Uses scanned ingredients + optional additions.";

    console.log(`Generated ${result.meals.length} meals (mode: ${mode}) from ${ingredients.length} ingredients for user ${user.id}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-meals-from-ingredients error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
