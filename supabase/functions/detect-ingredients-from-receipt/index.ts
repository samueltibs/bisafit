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

    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "At least one receipt image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (images.length > 2) {
      return new Response(JSON.stringify({ error: "Maximum 2 receipt images allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build content array with images
    const imageContent = images.map((imageBase64: string) => ({
      type: "image_url",
      image_url: {
        url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
      },
    }));

    const systemPrompt = `You are an AI assistant specialized in extracting FOOD ITEMS from grocery store receipts using OCR.

Your task is to analyze receipt images and identify all purchased FOOD ingredients.

Guidelines:
- ONLY extract food items (ingredients that can be used to cook meals)
- IGNORE non-food items like: paper towels, detergent, cleaning supplies, plastic bags, batteries, toiletries, pet supplies, household items
- Normalize receipt abbreviations (e.g., "CKEN BRST" → "chicken breast", "ORG MLK" → "organic milk")
- Include packaged foods, fresh produce, proteins, dairy, pantry items, frozen foods
- Be specific when possible (e.g., "ground beef" not just "beef")
- IGNORE prices, quantities, store names, dates, transaction numbers
- Estimate confidence based on OCR clarity - lower confidence for abbreviated or unclear items
- If the receipt is blurry or hard to read, note this and be conservative with identifications

You MUST respond with ONLY valid JSON in this exact format:
{
  "ingredients": [
    { "name": "chicken breast", "confidence": 0.91 },
    { "name": "brown rice", "confidence": 0.87 },
    { "name": "milk", "confidence": 0.93 }
  ],
  "ignored_items": ["paper towels", "detergent", "trash bags"],
  "notes": "Receipt abbreviations normalized. Some items were unclear due to faded print."
}

Do not include any text before or after the JSON.`;

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
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze these grocery receipt images and extract all FOOD items. Ignore non-food purchases. Return the results as JSON.",
              },
              ...imageContent,
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
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
          max_tokens: 2000,
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
    if (!result.ingredients || !Array.isArray(result.ingredients)) {
      result = { ingredients: [], ignored_items: [], notes: "Could not read the receipt. Please try a clearer photo." };
    }

    // Ensure each ingredient has required fields
    result.ingredients = result.ingredients.map((ing: { name?: string; confidence?: number }) => ({
      name: ing.name || "Unknown",
      confidence: typeof ing.confidence === "number" ? ing.confidence : 0.5,
    }));

    // Ensure ignored_items is an array
    result.ignored_items = Array.isArray(result.ignored_items) ? result.ignored_items : [];

    // Sort by confidence
    result.ingredients.sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence);

    // Check if low confidence overall - add warning
    const avgConfidence = result.ingredients.length > 0 
      ? result.ingredients.reduce((sum: number, i: { confidence: number }) => sum + i.confidence, 0) / result.ingredients.length 
      : 0;
    
    if (avgConfidence < 0.7 && result.ingredients.length > 0) {
      result.low_confidence_warning = true;
      result.notes = (result.notes || "") + " Some items had low confidence - please review carefully.";
    }

    console.log(`Detected ${result.ingredients.length} ingredients from receipt for user ${user.id}, ignored ${result.ignored_items.length} non-food items`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("detect-ingredients-from-receipt error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
