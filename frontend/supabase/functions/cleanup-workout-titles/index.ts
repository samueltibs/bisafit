import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chinese to focusKey mapping
const CHINESE_FOCUS_MAP: Record<string, string> = {
  '均衡': 'balance',
  '强化': 'strength',
  '稳定': 'stability',
  '力量': 'power',
  '耐力': 'endurance',
  '恢复': 'recovery',
  '灵活': 'mobility',
  '核心': 'core',
};

// Program key extraction pattern
const LEGACY_TITLE_PATTERN = /^(Foundation|Progression|Peak|Deload|Strength|Conditioning|Mobility)\s*(?:Day\s*)?(\d+)?([AB])?\s*(.*)$/i;

interface WorkoutMetadata {
  programKey: string;
  dayNumber?: number;
  variant?: string;
  focusKey?: string;
  titleKey?: string;
  title: string;
}

function parseLegacyTitle(title: string): WorkoutMetadata {
  // Remove Chinese characters for clean title
  const cleanTitle = title.replace(/[\u4e00-\u9fff]+/g, '').trim().replace(/\s+/g, ' ');
  
  const match = title.match(LEGACY_TITLE_PATTERN);
  
  if (!match) {
    // Extract Chinese focus if present
    const chineseMatch = title.match(/[\u4e00-\u9fff]+/);
    const focusKey = chineseMatch ? CHINESE_FOCUS_MAP[chineseMatch[0]] : undefined;
    
    return {
      programKey: 'custom',
      focusKey,
      title: cleanTitle || title,
    };
  }

  const [, program, dayNum, variant, rest] = match;
  const programKey = program.toLowerCase();
  const dayNumber = dayNum ? parseInt(dayNum, 10) : undefined;
  
  // Check for Chinese focus in the rest
  let focusKey: string | undefined;
  const restStr = rest?.trim() || '';
  
  for (const [chinese, key] of Object.entries(CHINESE_FOCUS_MAP)) {
    if (restStr.includes(chinese)) {
      focusKey = key;
      break;
    }
  }
  
  // Also check for English focus keywords
  if (!focusKey && restStr) {
    const lowerRest = restStr.toLowerCase();
    if (lowerRest.includes('balance')) focusKey = 'balance';
    else if (lowerRest.includes('strength')) focusKey = 'strength';
    else if (lowerRest.includes('stability')) focusKey = 'stability';
    else if (lowerRest.includes('power')) focusKey = 'power';
    else if (lowerRest.includes('recovery')) focusKey = 'recovery';
    else if (lowerRest.includes('mobility')) focusKey = 'mobility';
    else if (lowerRest.includes('upper')) focusKey = 'upper_body';
    else if (lowerRest.includes('lower')) focusKey = 'lower_body';
    else if (lowerRest.includes('full')) focusKey = 'full_body';
    else if (lowerRest.includes('hiit')) focusKey = 'hiit';
    else if (lowerRest.includes('cardio')) focusKey = 'cardio';
    else if (lowerRest.includes('core')) focusKey = 'core';
    else if (lowerRest.includes('endurance')) focusKey = 'endurance';
  }

  return {
    programKey,
    dayNumber,
    variant: variant || undefined,
    focusKey,
    titleKey: `workout.title.${programKey}`,
    title: cleanTitle,
  };
}

function hasMixedLanguageCharacters(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text) || 
         /[\u3040-\u30ff]/.test(text) ||
         /[\u0600-\u06ff]/.test(text) ||
         /[\u0400-\u04ff]/.test(text);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all workouts with potential mixed-language titles
    const { data: workouts, error: fetchError } = await supabaseClient
      .from('workouts')
      .select('id, title, workout_json');

    if (fetchError) {
      throw fetchError;
    }

    let cleanedCount = 0;
    const updates: Array<{ id: string; title: string; workout_json: Record<string, unknown> }> = [];

    for (const workout of workouts || []) {
      const title = workout.title || '';
      const jsonTitle = (workout.workout_json as Record<string, unknown>)?.title as string || '';
      
      const needsCleanup = hasMixedLanguageCharacters(title) || hasMixedLanguageCharacters(jsonTitle);
      
      if (needsCleanup) {
        const sourceTitle = title || jsonTitle;
        const parsed = parseLegacyTitle(sourceTitle);
        
        // Build the updated workout_json with metadata
        const updatedJson = {
          ...workout.workout_json as Record<string, unknown>,
          title: parsed.title,
          metadata: {
            programKey: parsed.programKey,
            dayNumber: parsed.dayNumber,
            variant: parsed.variant,
            focusKey: parsed.focusKey,
            titleKey: parsed.titleKey,
          },
        };
        
        updates.push({
          id: workout.id,
          title: parsed.title,
          workout_json: updatedJson,
        });
        
        cleanedCount++;
      }
    }

    // Apply updates
    for (const update of updates) {
      const { error: updateError } = await supabaseClient
        .from('workouts')
        .update({
          title: update.title,
          workout_json: update.workout_json,
        })
        .eq('id', update.id);

      if (updateError) {
        console.error(`Failed to update workout ${update.id}:`, updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        cleanedCount,
        message: `Cleaned ${cleanedCount} workout titles`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error cleaning workout titles:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
