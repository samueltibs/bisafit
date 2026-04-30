/**
 * BisaFit Branding Constants
 * 
 * Central source of truth for brand identity across the app.
 * Use these constants for consistent branding in UI, emails, and notifications.
 */

// App Identity
export const APP_NAME = 'BisaFit';
export const APP_DOMAIN = 'bisafit.com';
export const APP_URL = `https://${APP_DOMAIN}`;
export const APP_VERSION = '1.0.0';

// Email Addresses
export const EMAIL_NO_REPLY = 'no-reply@bisafit.com';
export const EMAIL_SUPPORT = 'support@bisafit.com';
export const EMAIL_STORE = 'store@bisafit.com';

// Support
export const SUPPORT_MESSAGE = `Need help? Contact us at ${EMAIL_SUPPORT}`;
export const SUPPORT_MESSAGE_SHORT = `Questions? Reach us anytime at ${EMAIL_SUPPORT}`;

// Email Footer (for all outgoing emails)
export const EMAIL_FOOTER_HTML = `
<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 12px; color: #666;">
  <p style="margin: 0;">© ${APP_NAME} • <a href="${APP_URL}" style="color: #666;">${APP_URL}</a></p>
  <p style="margin: 8px 0 0 0;">Need help? Contact <a href="mailto:${EMAIL_SUPPORT}" style="color: #666;">${EMAIL_SUPPORT}</a></p>
</div>
`;

export const EMAIL_FOOTER_TEXT = `
---
© ${APP_NAME} • ${APP_URL}
Need help? Contact ${EMAIL_SUPPORT}
`;

// Error messages with support reference
export const ERROR_MESSAGES = {
  generic: 'Something went wrong. Please try again.',
  genericWithSupport: `Something went wrong. Please try again or contact ${EMAIL_SUPPORT} for assistance.`,
  trialStart: `Unable to start your trial. Please try again or contact ${EMAIL_SUPPORT}.`,
  planGeneration: 'Failed to generate your plan. Please try again.',
  planGenerationPersistent: `Failed to generate your plan. Please contact ${EMAIL_SUPPORT}.`,
  aiCredits: `AI credits exhausted. Please contact ${EMAIL_SUPPORT}.`,
  network: 'Connection error. Please check your internet and try again.',
};
