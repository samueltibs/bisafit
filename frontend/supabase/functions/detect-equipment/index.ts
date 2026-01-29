import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Standard equipment IDs that map to the onboarding checklist
const KNOWN_EQUIPMENT = [
  "bodyweight", "dumbbells", "barbell", "squat_rack", "bench", 
  "resistance_bands", "pull_up_bar", "kettlebell", "cable_machine",
  "treadmill", "bike", "rower", "jump_rope", "ab_wheel", "plyo_box",
  "medicine_ball", "trx", "foam_roller", "yoga_mat", "ez_bar",
  "leg_press", "smith_machine", "lat_pulldown", "dip_station"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "No images provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (images.length > 2) {
      return new Response(
        JSON.stringify({ error: "Maximum 2 images allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build image content parts for the AI
    const imageContents = images.map((imageData: string) => ({
      type: "image_url",
      image_url: {
        url: imageData.startsWith("data:") ? imageData : `data:image/jpeg;base64,${imageData}`,
      },
    }));

    const systemPrompt = `You are an expert at identifying gym and fitness equipment from photos.

Your task is to analyze the image(s) and identify ALL fitness/gym equipment visible.

CRITICAL RULES:
1. Only identify equipment that is CLEARLY visible in the image
2. Map equipment to these standardized IDs when possible: ${KNOWN_EQUIPMENT.join(", ")}
3. If you see equipment not in the standard list, include it with a descriptive snake_case ID
4. Be specific - "adjustable dumbbells" should just be "dumbbells"
5. Don't guess - if something is unclear, don't include it
6. Include bodyweight-relevant items like yoga mats, foam rollers if visible

Return ONLY a JSON object with:
- detected_equipment: array of equipment IDs (use snake_case, lowercase)
- notes: brief description of what you observed (max 100 chars)

Example response:
{"detected_equipment": ["dumbbells", "bench", "barbell", "squat_rack"], "notes": "Home gym setup with adjustable dumbbells and power rack"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Please identify all the gym/fitness equipment visible in the image(s)." },
              ...imageContents,
            ],
          },
        ],
        temperature: 0.1, // Low temperature for more consistent results
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response from the AI
    let result: { detected_equipment: string[]; notes: string };
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse equipment detection results");
    }

    // Validate and normalize the equipment list
    const detectedEquipment = (result.detected_equipment || [])
      .map((e: string) => e.toLowerCase().trim().replace(/\s+/g, "_"))
      .filter((e: string) => e.length > 0);

    // Remove duplicates
    const uniqueEquipment = [...new Set(detectedEquipment)];

    console.log("Equipment detection complete:", uniqueEquipment);

    return new Response(
      JSON.stringify({
        detected_equipment: uniqueEquipment,
        notes: result.notes || "Equipment detected from photo analysis",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Equipment detection error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to detect equipment",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
