/**
 * Utility functions for transforming coach notes display
 */

/**
 * Patterns to match and remove from coach notes opening
 * These capture various AI-generated block reference patterns
 */
const BLOCK_REFERENCE_PATTERNS = [
  // "Welcome to Block 5" / "Welcome back to Block 3"
  /^welcome\s*(back)?\s*(to)?\s*(training)?\s*block\s*#?\d+[.!,]?\s*/i,
  // "Block 5:" / "Training Block 3:"
  /^(training\s*)?block\s*#?\d+[:\s]+/i,
  // "In Block 5," / "For Block 3,"
  /^(in|for)\s*(training\s*)?block\s*#?\d+[,\s]+/i,
  // "This is Block 5" / "This is your 5th block"
  /^this\s*is\s*(your\s*)?(training\s*)?block\s*#?\d+[.!,]?\s*/i,
  /^this\s*is\s*(your\s*)?\d+(st|nd|rd|th)\s*block[.!,]?\s*/i,
  // "Welcome — Block 5 focuses on"
  /^welcome\s*[—–-]\s*(training\s*)?block\s*#?\d+\s*/i,
  // Generic "Welcome back —" or "Welcome —" followed by block reference
  /^welcome\s*(back)?\s*[—–-]\s*(this\s*)?(training\s*)?block\s*/i,
  // "Welcome back, here's Block 5"
  /^welcome\s*(back)?\s*[,.]?\s*(here'?s?\s*)?(training\s*)?block\s*#?\d+[.!,]?\s*/i,
];

/**
 * Transform coach notes to ensure consistent greeting format
 * Replaces any block-reference opening with personalized greeting
 * 
 * @param notes - Original coach notes string
 * @param firstName - User's first name (defaults to 'there')
 * @returns Transformed coach notes with consistent greeting
 */
export function transformCoachNotes(notes: string | null | undefined, firstName?: string): string {
  if (!notes) return '';
  
  const name = firstName?.trim() || 'there';
  const greeting = `Welcome back, ${name}.`;
  
  let transformed = notes.trim();
  
  // Check if already starts with correct greeting
  const expectedStart = greeting.toLowerCase();
  if (transformed.toLowerCase().startsWith(expectedStart)) {
    return transformed;
  }
  
  // Remove any block reference patterns from the start
  for (const pattern of BLOCK_REFERENCE_PATTERNS) {
    transformed = transformed.replace(pattern, '');
  }
  
  // Also remove generic "Welcome back, " or "Welcome, " if present (we'll add our own)
  transformed = transformed.replace(/^welcome\s*(back)?\s*[,.]?\s*/i, '');
  
  // Trim and ensure first letter is capitalized
  transformed = transformed.trim();
  if (transformed.length > 0) {
    transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
  }
  
  // Combine greeting with cleaned content
  if (transformed.length > 0) {
    return `${greeting} ${transformed}`;
  }
  
  return greeting;
}

/**
 * Extract first name from full name
 */
export function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return 'there';
  const firstName = fullName.trim().split(/\s+/)[0];
  return firstName || 'there';
}
