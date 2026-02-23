import { ANALYTICS_DATA } from "../../utils/dashboardData";
import { COLORS } from "../../utils/colors";

export default function AnalyticsStrip() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Performance Overview
        </h2>
        <button className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium">
          Full Analytics →
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {ANALYTICS_DATA.map(({ label, value, pct, colorKey }) => {
          const c = COLORS[colorKey] || COLORS.teal;
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {label}
                </span>
                <span className={`text-xs font-bold ${c.text}`}>{value}</span>
              </div>
              <div className="relative h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full ${c.bar} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}