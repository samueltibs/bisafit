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

// Company Information
export const COMPANY_NAME = 'Bisa Group LLC';
export const COMPANY_ADDRESS = {
  street: '3171 S 129th E Ave',
  suite: 'Ste A #5254',
  city: 'Tulsa',
  state: 'OK',
  zip: '74134',
  country: 'United States',
};
export const COMPANY_ADDRESS_FULL = `${COMPANY_ADDRESS.street}, ${COMPANY_ADDRESS.suite}, ${COMPANY_ADDRESS.city}, ${COMPANY_ADDRESS.state} ${COMPANY_ADDRESS.zip}, ${COMPANY_ADDRESS.country}`;
export const COMPANY_ADDRESS_LINES = [
  COMPANY_ADDRESS.street,
  COMPANY_ADDRESS.suite,
  `${COMPANY_ADDRESS.city}, ${COMPANY_ADDRESS.state} ${COMPANY_ADDRESS.zip}`,
  COMPANY_ADDRESS.country,
];
export const COMPANY_PHONE = '+1 (918) 248-6269';

// Email Addresses
export const EMAIL_SUPPORT = 'support@bisagroup.org';
export const EMAIL_BISAFIT = 'bisafit@bisagroup.org';
export const EMAIL_INFO = 'info@bisagroup.org';
export const EMAIL_PARTNERS = 'partners@bisagroup.org';
export const EMAIL_BILLING = 'billing@bisagroup.org';
export const EMAIL_SENDER_DOMAIN = 'bisagroup.org';
// Legacy aliases for backward compatibility
export const EMAIL_STORE = EMAIL_SUPPORT;
export const EMAIL_NO_REPLY = EMAIL_BISAFIT;

// Support
export const SUPPORT_MESSAGE = `Need help? Contact us at ${EMAIL_SUPPORT}`;
export const SUPPORT_MESSAGE_SHORT = `Questions? Reach us anytime at ${EMAIL_SUPPORT}`;

// Email Footer (for all outgoing emails) - Required footer per company specs
export const EMAIL_FOOTER_HTML = `
<div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 12px; color: #666;">
  <p style="margin: 0; font-weight: 600; color: #333;">${APP_NAME} is a product of ${COMPANY_NAME}</p>
  <p style="margin: 12px 0 0 0;">${COMPANY_NAME}</p>
  <p style="margin: 4px 0 0 0;">${COMPANY_ADDRESS.street}</p>
  <p style="margin: 4px 0 0 0;">${COMPANY_ADDRESS.suite}</p>
  <p style="margin: 4px 0 0 0;">${COMPANY_ADDRESS.city}, ${COMPANY_ADDRESS.state} ${COMPANY_ADDRESS.zip}</p>
  <p style="margin: 4px 0 0 0;">${COMPANY_ADDRESS.country}</p>
  <p style="margin: 12px 0 0 0;">Support: <a href="mailto:${EMAIL_SUPPORT}" style="color: #666;">${EMAIL_SUPPORT}</a></p>
  <p style="margin: 4px 0 0 0;">Phone: ${COMPANY_PHONE}</p>
  <p style="margin: 16px 0 0 0; font-size: 11px; color: #999;">This email was sent regarding your ${APP_NAME} account.</p>
</div>
`;

export const EMAIL_FOOTER_TEXT = `
---
${APP_NAME} is a product of ${COMPANY_NAME}

${COMPANY_NAME}
${COMPANY_ADDRESS.street}
${COMPANY_ADDRESS.suite}
${COMPANY_ADDRESS.city}, ${COMPANY_ADDRESS.state} ${COMPANY_ADDRESS.zip}
${COMPANY_ADDRESS.country}

Support: ${EMAIL_SUPPORT}
Phone: ${COMPANY_PHONE}

This email was sent regarding your ${APP_NAME} account.
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
