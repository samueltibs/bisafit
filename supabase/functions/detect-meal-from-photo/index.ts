import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
}

interface DetectionResult {
  items: FoodItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  notes?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a nutrition expert AI that analyzes food photos. Your job is to:
1. Identify each distinct food item in the image
2. Estimate portion sizes based on visual cues
3. Provide calorie and macro estimates for each item

IMPORTANT RULES:
- Be conservative with estimates - it's better to slightly underestimate than overestimate
- Use standard serving sizes as reference
- For mixed dishes, try to identify the main components
- If unsure about a food, still provide your best estimate with lower confidence

You MUST respond using the detect_meal_items function.`;

    const userPrompt = `Analyze this meal photo and identify all food items with their estimated nutrition values.

For each item provide:
- name: The food item name
- portion: Estimated portion size (e.g., "1 cup", "4 oz", "1 medium")
- calories: Estimated calories
- protein_g: Estimated protein in grams
- carbs_g: Estimated carbs in grams
- fat_g: Estimated fat in grams
- confidence: Your confidence level from 0.0 to 1.0

Also provide any relevant notes about the meal.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'detect_meal_items',
              description: 'Return detected food items with nutrition estimates from a meal photo',
              parameters: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: 'Food item name' },
                        portion: { type: 'string', description: 'Estimated portion size' },
                        calories: { type: 'number', description: 'Estimated calories' },
                        protein_g: { type: 'number', description: 'Protein in grams' },
                        carbs_g: { type: 'number', description: 'Carbs in grams' },
                        fat_g: { type: 'number', description: 'Fat in grams' },
                        confidence: { type: 'number', description: 'Confidence 0-1' },
                      },
                      required: ['name', 'portion', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'confidence'],
                    },
                  },
                  notes: { type: 'string', description: 'Any relevant notes about the meal' },
                },
                required: ['items'],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'detect_meal_items' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the function call result
    let result: DetectionResult;
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      const items: FoodItem[] = parsed.items || [];
      
      // Calculate totals
      const totals = items.reduce(
        (acc, item) => ({
          calories: acc.calories + (item.calories || 0),
          protein: acc.protein + (item.protein_g || 0),
          carbs: acc.carbs + (item.carbs_g || 0),
          fat: acc.fat + (item.fat_g || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      result = {
        items,
        total_calories: Math.round(totals.calories),
        total_protein_g: Math.round(totals.protein * 10) / 10,
        total_carbs_g: Math.round(totals.carbs * 10) / 10,
        total_fat_g: Math.round(totals.fat * 10) / 10,
        notes: parsed.notes,
      };
    } else {
      // Fallback: try to parse from content
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            result = {
              items: parsed.items || [],
              total_calories: 0,
              total_protein_g: 0,
              total_carbs_g: 0,
              total_fat_g: 0,
              notes: 'Could not fully parse response',
            };
          } else {
            throw new Error('No JSON found in response');
          }
        } catch {
          result = {
            items: [],
            total_calories: 0,
            total_protein_g: 0,
            total_carbs_g: 0,
            total_fat_g: 0,
            error: 'Could not detect foods in image. Try a clearer photo.',
          };
        }
      } else {
        result = {
          items: [],
          total_calories: 0,
          total_protein_g: 0,
          total_carbs_g: 0,
          total_fat_g: 0,
          error: 'No response from AI',
        };
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('detect-meal-from-photo error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        items: [],
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
