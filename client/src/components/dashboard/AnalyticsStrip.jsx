import { COLORS } from "../../utils/colors";

/**
 * AnalyticsStrip
 *
 * Props:
 *   data    – array from API:
 *     [{ label, value, pct, colorKey }]
 *   loading – boolean
 *   onFull  – callback for "Full Analytics →" button
 *
 * Example usage (DashboardPage):
 *   const data = [
 *     { label: "Completion Rate", value: `${completedPct}%`, pct: completedPct, colorKey: "teal" },
 *     { label: "Avg Rating",      value: `${rating}/5`,      pct: (rating/5)*100, colorKey: "amber" },
 *     { label: "This Month",      value: thisMonth,           pct: Math.min((thisMonth/30)*100,100), colorKey: "cyan" },
 *     { label: "Pending",         value: pending,             pct: Math.min((pending/10)*100,100), colorKey: "rose" },
 *   ];
 *   <AnalyticsStrip data={data} />
 */
export default function AnalyticsStrip({ data = [], loading = false, onFull }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Performance Overview
        </h2>
        {onFull && (
          <button
            onClick={onFull}
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            Full Analytics →
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-3 rounded bg-gray-200 dark:bg-white/10 w-3/4" />
              <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/10 w-full" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No analytics data yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {data.map(({ label, value, pct, colorKey }) => {
            const c = COLORS[colorKey] || COLORS.teal;
            const safePct = Math.min(Math.max(pct || 0, 0), 100);
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">
                    {label}
                  </span>
                  <span className={`text-xs font-bold ml-1 shrink-0 ${c.text}`}>
                    {value}
                  </span>
                </div>
                <div className="relative h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.bar} transition-all duration-700`}
                    style={{ width: `${safePct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}