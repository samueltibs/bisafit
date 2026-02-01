/**
 * Admin Configuration
 * 
 * Centralized admin settings for the app.
 */

// List of admin email addresses (all lowercase for comparison)
export const ADMIN_EMAILS = [
  'samuel.m.tibs@gmail.com',
];

/**
 * Check if an email is an admin email
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
