/**
 * BisaFit Branding Constants for Edge Functions
 * 
 * Central source of truth for brand identity in backend code.
 */

// App Identity
export const APP_NAME = 'BisaFit';
export const APP_DOMAIN = 'bisafit.com';
export const APP_URL = `https://${APP_DOMAIN}`;

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
export const COMPANY_PHONE = '+1 (918) 248-6269';

// Email Addresses
export const EMAIL_SUPPORT = 'support@bisagroup.org';
export const EMAIL_BISAFIT = 'bisafit@bisagroup.org';
export const EMAIL_INFO = 'info@bisagroup.org';

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
  aiCredits: `AI credits exhausted. Please contact ${EMAIL_SUPPORT}.`,
  generic: `Something went wrong. Please contact ${EMAIL_SUPPORT} for assistance.`,
};
