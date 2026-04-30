/**
 * BisaFit Branding Constants for Edge Functions
 * 
 * Central source of truth for brand identity in backend code.
 */

// App Identity
export const APP_NAME = 'BisaFit';
export const APP_DOMAIN = 'bisafit.com';
export const APP_URL = `https://${APP_DOMAIN}`;

// Email Addresses
export const EMAIL_NO_REPLY = 'no-reply@bisafit.com';
export const EMAIL_SUPPORT = 'support@bisafit.com';
export const EMAIL_STORE = 'store@bisafit.com';

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
  aiCredits: `AI credits exhausted. Please contact ${EMAIL_SUPPORT}.`,
  generic: `Something went wrong. Please contact ${EMAIL_SUPPORT} for assistance.`,
};
