import { TrendingUp, TrendingDown } from "lucide-react";
import { COLORS } from "../../utils/colors";

export default function StatCard({ label, value, change, trend, colorKey, icon: Icon }) {
  const c = COLORS[colorKey] || COLORS.teal;

  return (
    <div className="glass-card p-5 rounded-2xl hover:scale-[1.02] transition-transform duration-200 cursor-default">
      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${c.bg} ring-1 ${c.ring}`}>
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend === "warn"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          }`}
        >
          {trend === "down"
            ? <TrendingDown className="h-3 w-3" />
            : <TrendingUp className="h-3 w-3" />
          }
          {trend === "warn" ? "!" : trend === "down" ? "↓" : "↑"}
        </span>
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
        {value}
      </p>

      {/* Label */}
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </p>

      {/* Change */}
      <p className={`text-[11px] font-medium ${
        trend === "warn"
          ? "text-amber-600 dark:text-amber-400"
          : "text-emerald-600 dark:text-emerald-400"
      }`}>
        {change}
      </p>
    </div>
  );
}