import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Branding constants
const APP_NAME = "BisaFit";
const APP_URL = "https://bisafit.com";
const EMAIL_NO_REPLY = "no-reply@bisafit.com";
const EMAIL_SUPPORT = "support@bisafit.com";
const PRIMARY_COLOR = "#10B981"; // Emerald green

// Common email styles
const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
  .container { max-width: 600px; margin: 0 auto; background: white; }
  .header { background: linear-gradient(135deg, ${PRIMARY_COLOR}, #059669); padding: 32px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 28px; }
  .header img { width: 60px; height: 60px; margin-bottom: 16px; }
  .content { padding: 32px; }
  .content h2 { color: #111; margin-top: 0; }
  .cta-button { display: inline-block; background: ${PRIMARY_COLOR}; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
  .cta-button:hover { background: #059669; }
  .feature-list { list-style: none; padding: 0; }
  .feature-list li { padding: 8px 0; padding-left: 28px; position: relative; }
  .feature-list li:before { content: "✓"; position: absolute; left: 0; color: ${PRIMARY_COLOR}; font-weight: bold; }
  .receipt-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .receipt-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
  .receipt-table td:first-child { color: #6b7280; }
  .receipt-table td:last-child { text-align: right; font-weight: 500; }
  .highlight-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; }
  .warning-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0; }
  .footer { background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; }
  .footer p { margin: 4px 0; color: #6b7280; font-size: 12px; }
  .footer a { color: ${PRIMARY_COLOR}; text-decoration: none; }
`;

const emailFooter = `
<div class="footer">
  <p>© ${APP_NAME} • <a href="${APP_URL}">${APP_URL}</a></p>
  <p>Need help? Contact <a href="mailto:${EMAIL_SUPPORT}">${EMAIL_SUPPORT}</a></p>
  <p style="margin-top: 12px; font-size: 11px; color: #9ca3af;">
    This is a transactional email related to your ${APP_NAME} account.
  </p>
</div>
`;

// Email template types
type EmailType = 
  | "welcome"
  | "trial_started"
  | "trial_ending"
  | "subscription_confirmed"
  | "payment_failed"
  | "subscription_cancelled";

interface EmailRequest {
  type: EmailType;
  userId: string;
  email: string;
  firstName?: string;
  data?: Record<string, any>;
}

// Template generators
function generateWelcomeEmail(firstName: string): { subject: string; html: string } {
  const name = firstName || "there";
  return {
    subject: `Welcome to ${APP_NAME} 💪`,
    html: `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>💪 ${APP_NAME}</h1>
    </div>
    <div class="content">
      <h2>Welcome, ${name}!</h2>
      <p>Your ${APP_NAME} account is ready. We're excited to help you on your fitness journey!</p>
      
      <div class="highlight-box">
        <strong>What ${APP_NAME} does for you:</strong>
        <ul class="feature-list">
          <li>Personalized AI-powered workout plans</li>
          <li>Custom nutrition guidance</li>
          <li>Progress tracking & smart adjustments</li>
          <li>Equipment & ingredient scanning</li>
        </ul>
      </div>
      
      <p>You have a <strong>7-day free trial</strong> to explore all premium features. No payment required to start!</p>
      
      <div style="text-align: center;">
        <a href="${APP_URL}/home" class="cta-button">Start My Journey</a>
      </div>
      
      <p>Questions? Reply to this email or reach out to <a href="mailto:${EMAIL_SUPPORT}">${EMAIL_SUPPORT}</a> anytime.</p>
    </div>
    ${emailFooter}
  </div>
</body>
</html>
    `,
  };
}

function generateTrialStartedEmail(firstName: string, trialEndDate: Date, planType: string): { subject: string; html: string } {
  const name = firstName || "there";
  const endDateStr = trialEndDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const startDateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  
  return {
    subject: `Your 7-day ${APP_NAME} trial has started`,
    html: `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Trial Started!</h1>
    </div>
    <div class="content">
      <h2>Let's go, ${name}!</h2>
      <p>Your 7-day ${APP_NAME} Premium trial is now active. Here's what you need to know:</p>
      
      <table class="receipt-table">
        <tr><td>Trial Started</td><td>${startDateStr}</td></tr>
        <tr><td>Trial Ends</td><td>${endDateStr}</td></tr>
        <tr><td>Selected Plan</td><td>${planType === "annual" ? "Annual" : "Monthly"}</td></tr>
      </table>
      
      <div class="highlight-box">
        <strong>You now have access to:</strong>
        <ul class="feature-list">
          <li>Personalized AI workouts</li>
          <li>Custom nutrition plans</li>
          <li>Ingredient & equipment scanning</li>
          <li>Calendar sync</li>
          <li>Smart progression engine</li>
        </ul>
      </div>
      
      <p>After your trial ends, your subscription will begin automatically. You can manage or cancel anytime from Settings.</p>
      
      <div style="text-align: center;">
        <a href="${APP_URL}/plan" class="cta-button">View My Plan</a>
      </div>
    </div>
    ${emailFooter}
  </div>
</body>
</html>
    `,
  };
}

function generateTrialEndingEmail(firstName: string, trialEndDate: Date): { subject: string; html: string } {
  const name = firstName || "there";
  const endDateStr = trialEndDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  
  return {
    subject: `Your ${APP_NAME} trial ends soon`,
    html: `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Trial Ending Soon</h1>
    </div>
    <div class="content">
      <h2>Hey ${name},</h2>
      <p>Just a friendly reminder that your ${APP_NAME} trial ends on <strong>${endDateStr}</strong>.</p>
      
      <div class="warning-box">
        <strong>Don't lose access to:</strong>
        <ul class="feature-list">
          <li>Your personalized workout plans</li>
          <li>Nutrition tracking & meal plans</li>
          <li>Progress history & analytics</li>
        </ul>
      </div>
      
      <p><strong>Subscription pricing:</strong></p>
      <ul>
        <li>Monthly: $9.99/month</li>
        <li>Annual: $59.99/year (save 50%!)</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${APP_URL}/settings" class="cta-button">Manage Subscription</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">If you don't wish to continue, no action is needed. Your access will end on the trial end date.</p>
    </div>
    ${emailFooter}
  </div>
</body>
</html>
    `,
  };
}

function generateSubscriptionConfirmedEmail(
  firstName: string,
  planType: string,
  amount: string,
  transactionDate: Date,
  paymentMethod?: string
): { subject: string; html: string } {
  const name = firstName || "there";
  const dateStr = transactionDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  
  return {
    subject: `Payment received – ${APP_NAME} subscription`,
    html: `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Payment Confirmed</h1>
    </div>
    <div class="content">
      <h2>Thank you, ${name}!</h2>
      <p>We've received your payment. Here's your receipt:</p>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; border-bottom: 2px solid ${PRIMARY_COLOR}; padding-bottom: 8px;">${APP_NAME} Receipt</h3>
        <table class="receipt-table">
          <tr><td>Plan</td><td>${APP_NAME} ${planType === "annual" ? "Annual" : "Monthly"}</td></tr>
          <tr><td>Amount</td><td><strong>${amount}</strong></td></tr>
          <tr><td>Date</td><td>${dateStr}</td></tr>
          ${paymentMethod ? `<tr><td>Payment Method</td><td>•••• ${paymentMethod}</td></tr>` : ""}
        </table>
      </div>
      
      <div class="highlight-box">
        <p style="margin: 0;">You now have full access to all ${APP_NAME} Premium features. Keep crushing your goals! 💪</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${APP_URL}/settings" class="cta-button">View Subscription</a>
      </div>
    </div>
    ${emailFooter}
  </div>
</body>
</html>
    `,
  };
}

function generatePaymentFailedEmail(firstName: string): { subject: string; html: string } {
  const name = firstName || "there";
  
  return {
    subject: `Action required: payment issue`,
    html: `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
      <h1>⚠️ Payment Issue</h1>
    </div>
    <div class="content">
      <h2>Hey ${name},</h2>
      <p>We tried to process your ${APP_NAME} subscription payment, but it didn't go through.</p>
      
      <div class="warning-box">
        <strong>Don't worry!</strong> Your account is still active for now. Please update your payment method to avoid any interruption to your service.
      </div>
      
      <p>Common reasons for payment failures:</p>
      <ul>
        <li>Expired card</li>
        <li>Insufficient funds</li>
        <li>Card blocked by your bank</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${APP_URL}/settings" class="cta-button">Update Payment Method</a>
      </div>
      
      <p>If you need help, contact us at <a href="mailto:${EMAIL_SUPPORT}">${EMAIL_SUPPORT}</a>.</p>
    </div>
    ${emailFooter}
  </div>
</body>
</html>
    `,
  };
}

function generateSubscriptionCancelledEmail(firstName: string, accessEndDate: Date): { subject: string; html: string } {
  const name = firstName || "there";
  const endDateStr = accessEndDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  
  return {
    subject: `Subscription cancelled`,
    html: `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #6b7280, #4b5563);">
      <h1>Subscription Cancelled</h1>
    </div>
    <div class="content">
      <h2>We're sorry to see you go, ${name}</h2>
      <p>Your ${APP_NAME} subscription has been cancelled as requested.</p>
      
      <table class="receipt-table">
        <tr><td>Access Until</td><td><strong>${endDateStr}</strong></td></tr>
      </table>
      
      <p>You'll continue to have access to all premium features until your current billing period ends.</p>
      
      <div class="highlight-box">
        <p style="margin: 0;">Changed your mind? You can reactivate your subscription anytime and pick up right where you left off.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${APP_URL}/paywall" class="cta-button">Reactivate Subscription</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">We'd love to hear your feedback! Reply to this email and let us know how we can improve.</p>
    </div>
    ${emailFooter}
  </div>
</body>
</html>
    `,
  };
}

// Main handler
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, userId, email, firstName, data }: EmailRequest = await req.json();

    console.log(`Processing ${type} email for user ${userId}`);

    // Check email consent
    const { data: profile } = await supabase
      .from("users_profile")
      .select("email_consent, full_name")
      .eq("id", userId)
      .single();

    if (profile?.email_consent === false) {
      console.log("User has opted out of emails");
      return new Response(
        JSON.stringify({ success: false, reason: "email_consent_disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use profile name if firstName not provided
    const name = firstName || profile?.full_name?.split(" ")[0] || "";

    // Generate email content based on type
    let emailContent: { subject: string; html: string };
    
    switch (type) {
      case "welcome":
        emailContent = generateWelcomeEmail(name);
        break;
      case "trial_started":
        emailContent = generateTrialStartedEmail(
          name,
          new Date(data?.trialEndDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
          data?.planType || "monthly"
        );
        break;
      case "trial_ending":
        emailContent = generateTrialEndingEmail(
          name,
          new Date(data?.trialEndDate || Date.now() + 2 * 24 * 60 * 60 * 1000)
        );
        break;
      case "subscription_confirmed":
        emailContent = generateSubscriptionConfirmedEmail(
          name,
          data?.planType || "monthly",
          data?.amount || "$9.99",
          new Date(data?.transactionDate || Date.now()),
          data?.paymentMethod
        );
        break;
      case "payment_failed":
        emailContent = generatePaymentFailedEmail(name);
        break;
      case "subscription_cancelled":
        emailContent = generateSubscriptionCancelledEmail(
          name,
          new Date(data?.accessEndDate || Date.now() + 30 * 24 * 60 * 60 * 1000)
        );
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Log the email attempt
    const { data: logEntry, error: logError } = await supabase
      .from("email_log")
      .insert({
        user_id: userId,
        email_type: type,
        recipient_email: email,
        subject: emailContent.subject,
        status: "pending",
        metadata: data || {},
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create email log:", logError);
    }

    // Send the email via Resend
    const emailResponse = await resend.emails.send({
      from: `${APP_NAME} <${EMAIL_NO_REPLY}>`,
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Resend response:", emailResponse);

    // Update log with result
    if (logEntry?.id) {
      if (emailResponse.error) {
        await supabase
          .from("email_log")
          .update({
            status: "failed",
            error_message: emailResponse.error.message,
          })
          .eq("id", logEntry.id);
      } else {
        await supabase
          .from("email_log")
          .update({
            status: "sent",
            resend_id: emailResponse.data?.id,
            sent_at: new Date().toISOString(),
          })
          .eq("id", logEntry.id);
      }
    }

    // Mark welcome email as sent if applicable
    if (type === "welcome" && !emailResponse.error) {
      await supabase
        .from("users_profile")
        .update({ welcome_email_sent: true })
        .eq("id", userId);
    }

    if (emailResponse.error) {
      throw new Error(emailResponse.error.message);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
