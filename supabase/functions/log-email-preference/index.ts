import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LogRequest {
  userId: string;
  previousEmailConsent: boolean;
  newEmailConsent: boolean;
  previousPreferences: string[];
  newPreferences: string[];
  changeSource: 'app' | 'unsubscribe_link' | 'admin';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: LogRequest = await req.json();

    const { error } = await supabase
      .from("email_preference_log")
      .insert({
        user_id: body.userId,
        previous_email_consent: body.previousEmailConsent,
        new_email_consent: body.newEmailConsent,
        previous_preferences: body.previousPreferences,
        new_preferences: body.newPreferences,
        change_source: body.changeSource,
      });

    if (error) {
      console.error("Failed to log preference change:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in log-email-preference:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
