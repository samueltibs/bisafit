import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple token generation/validation using user ID + timestamp hash
function generateUnsubscribeToken(userId: string, secret: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId + secret);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function validateToken(userId: string, token: string, secret: string): boolean {
  const expectedToken = generateUnsubscribeToken(userId, secret);
  return token === expectedToken;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const unsubscribeSecret = Deno.env.get("UNSUBSCRIBE_SECRET") || supabaseServiceKey.slice(0, 32);

    const url = new URL(req.url);
    const userId = url.searchParams.get("uid");
    const token = url.searchParams.get("token");

    if (!userId || !token) {
      return new Response(
        generateHtmlPage("Invalid Link", "This unsubscribe link is invalid or has expired.", false),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Validate token
    if (!validateToken(userId, token, unsubscribeSecret)) {
      return new Response(
        generateHtmlPage("Invalid Link", "This unsubscribe link is invalid or has expired.", false),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Get current preferences
    const { data: profile, error: fetchError } = await supabase
      .from("users_profile")
      .select("email_consent, email_preferences_json")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      return new Response(
        generateHtmlPage("User Not Found", "We couldn't find your account.", false),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    const previousConsent = profile.email_consent;
    const previousPreferences = profile.email_preferences_json || [];

    // Update preferences to unsubscribe from optional emails
    const { error: updateError } = await supabase
      .from("users_profile")
      .update({
        email_consent: false,
        email_preferences_json: [],
      })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    // Log the change
    await supabase
      .from("email_preference_log")
      .insert({
        user_id: userId,
        previous_email_consent: previousConsent,
        new_email_consent: false,
        previous_preferences: previousPreferences,
        new_preferences: [],
        change_source: "unsubscribe_link",
      });

    return new Response(
      generateHtmlPage(
        "Unsubscribed Successfully",
        "You've been unsubscribed from optional emails. You'll still receive important transactional emails like receipts and account notices.",
        true
      ),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  } catch (error: any) {
    console.error("Error in unsubscribe:", error);
    return new Response(
      generateHtmlPage("Error", "Something went wrong. Please try again or contact support@bisafit.com.", false),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  }
};

function generateHtmlPage(title: string, message: string, success: boolean): string {
  const iconColor = success ? "#10B981" : "#EF4444";
  const icon = success 
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - BisaFit</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #f9fafb, #f3f4f6);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      padding: 48px;
      text-align: center;
      max-width: 480px;
    }
    .icon {
      color: ${iconColor};
      margin-bottom: 24px;
    }
    h1 {
      font-size: 24px;
      color: #111827;
      margin-bottom: 16px;
    }
    p {
      color: #6B7280;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      background: #10B981;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #059669;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E5E7EB;
      font-size: 14px;
      color: #9CA3AF;
    }
    .footer a {
      color: #10B981;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://bisafit.com" class="btn">Go to BisaFit</a>
    <div class="footer">
      <p>© BisaFit • <a href="https://bisafit.com">bisafit.com</a></p>
      <p style="margin-top: 8px;">Need help? <a href="mailto:support@bisafit.com">support@bisafit.com</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

// Export token generator for use in email templates
export { generateUnsubscribeToken };

serve(handler);
