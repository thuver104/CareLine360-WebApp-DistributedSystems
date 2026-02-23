/**
 * Derive a display name from a user's email address.
 * e.g. "john.smith@careline.com" → "John Smith"
 */
export function displayName(user) {
  if (!user?.email) return "Unknown";
  const local = user.email.split("@")[0];
  return local
    .split(/[._-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
