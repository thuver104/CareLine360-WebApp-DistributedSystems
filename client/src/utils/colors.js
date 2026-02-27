// ── Shared color palette tokens used across dashboard components ──────────────
export const COLORS = {
  teal: {
    bg:   "bg-teal-500/15 dark:bg-teal-500/20",
    text: "text-teal-600 dark:text-teal-400",
    bar:  "bg-gradient-to-r from-teal-400 to-teal-600",
    ring: "ring-teal-500/20",
  },
  cyan: {
    bg:   "bg-cyan-500/15 dark:bg-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
    bar:  "bg-gradient-to-r from-cyan-400 to-cyan-600",
    ring: "ring-cyan-500/20",
  },
  violet: {
    bg:   "bg-violet-500/15 dark:bg-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
    bar:  "bg-gradient-to-r from-violet-400 to-violet-600",
    ring: "ring-violet-500/20",
  },
  rose: {
    bg:   "bg-rose-500/15 dark:bg-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    bar:  "bg-gradient-to-r from-rose-400 to-rose-600",
    ring: "ring-rose-500/20",
  },
  amber: {
    bg:   "bg-amber-500/15 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    bar:  "bg-gradient-to-r from-amber-400 to-amber-600",
    ring: "ring-amber-500/20",
  },
  emerald: {
    bg:   "bg-emerald-500/15 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    bar:  "bg-gradient-to-r from-emerald-400 to-emerald-600",
    ring: "ring-emerald-500/20",
  },
  blue: {
    bg:   "bg-blue-500/15 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    bar:  "bg-gradient-to-r from-blue-400 to-blue-600",
    ring: "ring-blue-500/20",
  },
};

/** Get initials from a full name string */
export const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/** Status badge classes — matches Appointment.status enum */
export const STATUS_BADGE = {
  pending:   "bg-amber-100  text-amber-800  dark:bg-amber-900/40  dark:text-amber-300",
  confirmed: "bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  cancelled: "bg-rose-100   text-rose-800   dark:bg-rose-900/40   dark:text-rose-300",
  // Legacy uppercase aliases (AppointmentsTable used these)
  REQUESTED: "bg-amber-100  text-amber-800  dark:bg-amber-900/40  dark:text-amber-300",
  ACCEPTED:  "bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  CANCELLED: "bg-rose-100   text-rose-800   dark:bg-rose-900/40   dark:text-rose-300",
};

/** Priority badge classes — matches Appointment.priority enum */
export const PRIORITY_BADGE = {
  low:    "bg-gray-100   text-gray-600   dark:bg-gray-700  dark:text-gray-300",
  medium: "bg-blue-100   text-blue-700   dark:bg-blue-900/40  dark:text-blue-300",
  high:   "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  urgent: "bg-rose-100   text-rose-700   dark:bg-rose-900/40   dark:text-rose-300",
};