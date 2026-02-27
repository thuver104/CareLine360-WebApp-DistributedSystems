import {
  CheckCircle,
  FileText,
  AlertTriangle,
  Users,
  Star,
  Clock,
} from "lucide-react";
import { COLORS } from "../../utils/colors";

const ICON_MAP = {
  completed:    CheckCircle,
  prescription: FileText,
  alert:        AlertTriangle,
  patient:      Users,
  review:       Star,
  appointment:  Clock,
};

const TYPE_COLOR = {
  completed:    "teal",
  prescription: "violet",
  alert:        "rose",
  patient:      "cyan",
  review:       "amber",
  appointment:  "blue",
};

/**
 * ActivityFeed
 *
 * Props:
 *   activities – array from API:
 *     [{ type, message, time, colorKey? }]
 *
 *   If activities is not provided, the component renders a
 *   "no recent activity" empty state — it never uses hardcoded data.
 *
 * Usage example (DashboardPage):
 *   const activities = appointments.slice(0, 5).map(a => ({
 *     type: a.status === "completed" ? "completed" : "appointment",
 *     message: `Appointment with ${a.patientProfile?.fullName} — ${a.status}`,
 *     time: new Date(a.date).toLocaleDateString("en-GB"),
 *   }));
 *   <ActivityFeed activities={activities} />
 */
export default function ActivityFeed({ activities = [], loading = false, onSeeAll }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h2>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            See all →
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-2 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/10 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 rounded bg-gray-200 dark:bg-white/10 w-4/5" />
                <div className="h-2.5 rounded bg-gray-200 dark:bg-white/10 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
          <Clock className="h-8 w-8 opacity-30" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((item, i) => {
            const Icon = ICON_MAP[item.type] || CheckCircle;
            const colorKey = item.colorKey || TYPE_COLOR[item.type] || "teal";
            const c = COLORS[colorKey] || COLORS.teal;

            return (
              <div
                key={i}
                className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/30 dark:hover:bg-white/5 transition-colors cursor-default"
              >
                <div className={`shrink-0 p-2 rounded-lg ${c.bg} ring-1 ${c.ring}`}>
                  <Icon className={`h-3.5 w-3.5 ${c.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">
                    {item.message}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}