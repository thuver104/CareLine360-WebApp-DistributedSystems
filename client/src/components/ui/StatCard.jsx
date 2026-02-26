import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { COLORS } from "../../utils/colors";

// Animated number that counts up from 0 to `target`
function AnimatedNumber({ target }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (typeof target !== "number" || isNaN(target)) return;
    const duration = 700;
    const start = 0;

    cancelAnimationFrame(frameRef.current);
    startRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(eased * (target - start) + start));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target]);

  return <>{display}</>;
}

/**
 * StatCard
 *
 * Props:
 *   label    – string  e.g. "Today's Appointments"
 *   value    – number | string from API (e.g. stats.todayAppointments)
 *   change   – string  e.g. "+3 from last week"
 *   trend    – "up" | "down" | "warn" | "neutral"
 *   colorKey – keyof COLORS
 *   icon     – lucide-react icon component
 *   loading  – boolean (shows skeleton)
 */
export default function StatCard({
  label,
  value,
  change,
  trend = "neutral",
  colorKey = "teal",
  icon: Icon,
  loading = false,
}) {
  const c = COLORS[colorKey] || COLORS.teal;
  const isNumeric = typeof value === "number" && !isNaN(value);

  if (loading) {
    return (
      <div className="glass-card p-5 rounded-2xl animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/10" />
          <div className="w-12 h-5 rounded-full bg-gray-200 dark:bg-white/10" />
        </div>
        <div className="h-7 w-12 rounded bg-gray-200 dark:bg-white/10 mb-2" />
        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-white/10 mb-2" />
        <div className="h-2.5 w-20 rounded bg-gray-200 dark:bg-white/10" />
      </div>
    );
  }

  const TrendIcon =
    trend === "down" ? TrendingDown : trend === "neutral" ? Minus : TrendingUp;

  const trendBg =
    trend === "warn"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      : trend === "down"
        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
        : trend === "neutral"
          ? "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";

  const changeColor =
    trend === "warn"
      ? "text-amber-600 dark:text-amber-400"
      : trend === "down"
        ? "text-rose-600 dark:text-rose-400"
        : trend === "neutral"
          ? "text-gray-400"
          : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="glass-card p-5 rounded-2xl hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-default">
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${c.bg} ring-1 ${c.ring}`}>
          {Icon && <Icon className={`h-5 w-5 ${c.text}`} />}
        </div>
        {trend !== "neutral" && (
          <span
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${trendBg}`}
          >
            <TrendIcon className="h-3 w-3" />
            {trend === "warn" ? "!" : trend === "down" ? "↓" : "↑"}
          </span>
        )}
      </div>

      {/* Value — animated counter for numbers, plain string otherwise */}
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
        {isNumeric ? <AnimatedNumber target={value} /> : (value ?? "—")}
      </p>

      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </p>

      {change && (
        <p className={`text-[11px] font-medium ${changeColor}`}>{change}</p>
      )}
    </div>
  );
}
