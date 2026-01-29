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
  detailed_instructions?: string[];
  gourmet_notes?: string;
  protein_g_est: number;
  calories_est: number;
  cuisine_style?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  recipe_source_url?: string;
  meal_prep_notes?: string;
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

    const { days = 7, ingredients, weekCuisineTheme, ingredientMode = 'flexible_prefer' } = await req.json().catch(() => ({ days: 7, ingredients: null, weekCuisineTheme: null, ingredientMode: 'flexible_prefer' }));

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

    // Determine active cuisine theme - applies freely when no ingredients uploaded
    const activeCuisine = weekCuisineTheme || (cuisinePreferences.length > 0 ? cuisinePreferences[0] : null);
    
    const cuisineInstructions = activeCuisine
      ? `CUISINE THEME: "${activeCuisine}"
- Prefer recipes aligned with ${activeCuisine} cuisine
- If perfect alignment is not possible, generate "${activeCuisine}-inspired" or "${activeCuisine}-style" meals
- Add "cuisine_style" field to each meal (e.g., "Indian", "Indian-inspired", or null if no theme)
- NEVER fail generation due to cuisine mismatch - always provide meals
- Dietary restrictions and nutrition targets take priority over cuisine theme`
      : `CUISINE: No specific theme. Use variety based on user's general cuisine preferences: ${JSON.stringify(cuisinePreferences)}`;

    // Ingredient mode logic:
    // - If NO ingredients uploaded: ingredientInstructions is empty, cuisine applies freely with no compatibility checks
    // - If ingredients uploaded + Strict mode: Only use listed ingredients, no additions allowed
    // - If ingredients uploaded + Flexible mode: Prioritize listed ingredients, allow up to 5 staples
    // NOTE: "No ingredients" is NOT the same as Strict mode - Strict only applies when ingredients exist AND user selected it
    const hasIngredients = ingredients && Array.isArray(ingredients) && ingredients.length > 0;
    const isStrictMode = ingredientMode === 'strict_only';
    
    const ingredientInstructions = hasIngredients
      ? isStrictMode
        ? `STRICT INGREDIENT MODE: Use ONLY these ingredients: ${ingredients.join(", ")}
- Do NOT add any oils, spices, sauces, or staples that are not in this list
- If an ingredient is not listed, do NOT use it
- Create simpler meals if needed - this is acceptable
- NEVER add optional or missing ingredients`
        : `FLEXIBLE INGREDIENT MODE: Prioritize these ingredients: ${ingredients.join(", ")}
- Build meals primarily around these available ingredients
- You may add up to 5 common staples if needed (oil, salt, pepper, garlic, basic spices)
- List any additions separately in recipe notes`
      : ""; // No ingredient constraints - cuisine theme applies freely

    const systemPrompt = `You are a nutrition expert creating detailed meal plans. Generate practical, delicious meals that meet nutritional targets.

CRITICAL RULES:
1. STRICTLY respect dietary restrictions (allergies, vegetarian, vegan, halal, etc.) - NEVER violate these
2. Match the calorie and protein targets
3. Create recipes with BOTH quick summary AND detailed step-by-step instructions
4. Consider budget level for ingredient choices
5. Return ONLY valid JSON, no markdown
6. Cuisine preferences are FLEXIBLE - never fail due to cuisine mismatch

${cuisineInstructions}

MEAL STRUCTURE - Each meal MUST include:
- name: meal type (Breakfast, Lunch, Dinner, Snack)
- recipe_title: descriptive recipe name
- ingredients: array of ingredients with amounts (e.g., "2 chicken breasts, 400g")
- instructions: brief 2-4 sentence summary for quick reference
- detailed_instructions: array of 8-15 detailed steps including:
  * Prep steps (mise en place, cutting, marinating)
  * Cooking steps with specific temperatures and times
  * Finishing steps (resting, plating, garnishing)
- protein_g_est: estimated protein in grams
- calories_est: estimated calories
- prep_time_minutes: time for preparation
- cook_time_minutes: time for cooking
- servings: number of portions
- cuisine_style: cuisine type or null
- meal_prep_notes: storage time, reheating tips, make-ahead instructions (optional, include for suitable meals)
- gourmet_notes: chef tips, technique variations, ingredient upgrades, plating suggestions for adventurous cooks (optional but recommended)`;

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
        { 
          "name": "Breakfast", 
          "recipe_title": "High-Protein Greek Yogurt Bowl", 
          "ingredients": ["200g Greek yogurt", "30g honey", "50g mixed berries", "25g granola"],
          "instructions": "Layer Greek yogurt in a bowl, drizzle with honey, top with berries and granola. Serve immediately.",
          "detailed_instructions": [
            "Gather all ingredients and ensure yogurt is well-chilled",
            "Spoon 200g of Greek yogurt into a serving bowl, spreading evenly",
            "Drizzle 30g of honey in a zigzag pattern over the yogurt",
            "Wash and pat dry 50g of mixed berries",
            "Arrange berries on top of the yogurt in an even layer",
            "Sprinkle 25g of granola over the berries for crunch",
            "Optional: add a pinch of cinnamon for extra flavor",
            "Serve immediately for best texture"
          ],
          "protein_g_est": 25, 
          "calories_est": 380,
          "prep_time_minutes": 5,
          "cook_time_minutes": 0,
          "servings": 1,
          "cuisine_style": null,
          "meal_prep_notes": "Prep yogurt and berries the night before, add granola just before eating to keep it crunchy",
          "gourmet_notes": "For extra indulgence, drizzle with tahini or add a sprinkle of bee pollen. Swap granola for toasted coconut flakes for a tropical twist. Try layering in a glass for a parfait presentation."
        }
      ],
      "snacks": [
        { 
          "name": "Snack 1", 
          "recipe_title": "Protein Energy Balls", 
          "ingredients": ["100g oats", "60g peanut butter", "30g honey", "25g protein powder"],
          "instructions": "Mix all ingredients, roll into balls, refrigerate for 30 minutes.",
          "detailed_instructions": [
            "Add oats to a large mixing bowl",
            "Add peanut butter and mix until oats are coated",
            "Drizzle in honey and continue mixing",
            "Add protein powder and combine until a sticky dough forms",
            "If too dry, add 1 tsp water; if too wet, add more oats",
            "Using slightly wet hands, roll mixture into 8-10 balls",
            "Place on parchment-lined tray",
            "Refrigerate for at least 30 minutes until firm",
            "Store in airtight container in fridge for up to 1 week"
          ],
          "protein_g_est": 8, 
          "calories_est": 120,
          "prep_time_minutes": 10,
          "cook_time_minutes": 0,
          "servings": 10,
          "cuisine_style": null,
          "meal_prep_notes": "Make a batch on Sunday for the whole week. Keep refrigerated up to 7 days or freeze for 1 month.",
          "gourmet_notes": "Roll in cocoa powder, shredded coconut, or crushed nuts for variety. Add a teaspoon of espresso powder for a mocha version. Use almond butter for a different flavor profile."
        }
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
