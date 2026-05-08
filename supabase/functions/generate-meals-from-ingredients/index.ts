import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ingredients, dietary_preferences, calorie_target, num_meals } = await req.json()

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = `You are a professional nutritionist. Generate ${num_meals || 3} meal suggestions using these ingredients: ${ingredients.join(', ')}.
    
${dietary_preferences ? `Dietary preferences: ${dietary_preferences}` : ''}
${calorie_target ? `Target calories per meal: ${calorie_target}` : ''}

For each meal, provide:
- name: creative meal name
- description: brief description
- ingredients: list with amounts
- instructions: step-by-step cooking instructions (numbered)
- nutrition: { calories, protein_g, carbs_g, fat_g, fiber_g }
- prep_time_minutes: estimated prep time
- cook_time_minutes: estimated cook time
- difficulty: easy/medium/hard
- tags: array of relevant tags (e.g., high-protein, low-carb, quick, vegetarian)

Return as JSON array.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional nutritionist and chef. Always return valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    })

    const data = await response.json()
    const meals = JSON.parse(data.choices[0].message.content)

    return new Response(JSON.stringify(meals), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
