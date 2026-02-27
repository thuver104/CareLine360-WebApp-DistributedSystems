/**
 * Return a display name for a user.
 * Prefers fullName from the User model; falls back to email-derived name.
 */
export function displayName(user) {
  if (user?.fullName) return user.fullName;
  if (!user?.email) return "Unknown";
  const local = user.email.split("@")[0];
  return local
    .split(/[._-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
