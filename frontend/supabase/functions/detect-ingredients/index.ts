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
      return new Response(JSON.stringify({ error: "At least one image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (images.length > 3) {
      return new Response(JSON.stringify({ error: "Maximum 3 images allowed" }), {
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

    const systemPrompt = `You are an AI assistant specialized in identifying food ingredients from photos of refrigerators, pantries, and kitchen shelves.

Your task is to carefully analyze the provided images and identify all visible food ingredients.

Guidelines:
- Identify specific ingredients, not dishes (e.g., "chicken breast" not "chicken dish")
- Include fresh produce, proteins, dairy, condiments, and pantry items
- Be specific when possible (e.g., "Greek yogurt" vs just "yogurt")
- Include packaged items you can identify from labels
- Estimate confidence based on visibility and clarity
- If something is unclear or partially visible, lower the confidence score

You MUST respond with ONLY valid JSON in this exact format:
{
  "ingredients": [
    { "name": "chicken breast", "confidence": 0.92 },
    { "name": "spinach", "confidence": 0.88 },
    { "name": "eggs", "confidence": 0.95 }
  ],
  "notes": "Optional clarifications about items that were unclear or packaging that couldn't be read"
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
                text: "Please analyze these images and identify all food ingredients you can see. Return the results as JSON.",
              },
              ...imageContent,
            ],
          },
        ],
        temperature: 0.3,
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
      // Clean up markdown if present
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error, attempting repair...", parseError);

      // Retry with JSON repair prompt
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
      result = { ingredients: [], notes: "Could not detect ingredients from the images." };
    }

    // Ensure each ingredient has required fields
    result.ingredients = result.ingredients.map((ing: { name?: string; confidence?: number }) => ({
      name: ing.name || "Unknown",
      confidence: typeof ing.confidence === "number" ? ing.confidence : 0.5,
    }));

    // Sort by confidence
    result.ingredients.sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence);

    console.log(`Detected ${result.ingredients.length} ingredients for user ${user.id}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("detect-ingredients error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
