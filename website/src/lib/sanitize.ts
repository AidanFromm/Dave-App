/**
 * Input sanitization utilities
 */

/** Strip HTML tags from a string */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

/** Sanitize a general text string — strip HTML, limit length */
export function sanitizeString(input: string, maxLength = 1000): string {
  return stripHtml(input).slice(0, maxLength);
}

/** Validate and normalize an email address */
export function sanitizeEmail(input: string): string | null {
  const cleaned = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : null;
}

/** Sanitize an object's string fields recursively */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (typeof val === "string") {
      (result as Record<string, unknown>)[key] = sanitizeString(val);
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(val as Record<string, unknown>);
    }
  }
  return result;
}
