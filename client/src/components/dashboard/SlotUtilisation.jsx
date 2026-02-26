import { motion } from "framer-motion";

/**
 * SlotUtilisation – Weekly schedule heatmap
 *
 * Props:
 *   data    – array of 7 day objects:
 *     { label, dateStr, total, booked, appts, pct, isToday }
 *   summary – { totalSlots, totalBooked, totalFree, totalAppts }
 *   loading – boolean
 */

const barColor = (pct, isToday) => {
  if (isToday) return "from-cyan-400 to-teal-500";
  if (pct === 0)
    return "from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700";
  if (pct <= 40) return "from-teal-400 to-emerald-500";
  if (pct <= 75) return "from-amber-400 to-orange-500";
  return "from-rose-400 to-red-500";
};

const textColor = (pct, isToday) => {
  if (isToday) return "text-cyan-600 dark:text-cyan-400";
  if (pct === 0) return "text-gray-400";
  if (pct <= 40) return "text-emerald-600 dark:text-emerald-400";
  if (pct <= 75) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

export default function SlotUtilisation({
  data = [],
  summary = null,
  loading = false,
}) {
  const maxTotal = Math.max(...data.map((d) => d.total || 0), 1);

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Weekly Slot Utilisation
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Current week · Mon – Sun
          </p>
        </div>
        {summary && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {summary.totalBooked}/{summary.totalSlots} booked
            </span>
          </div>
        )}
      </div>

      {/* Bar chart */}
      {loading ? (
        <div className="flex items-end justify-between gap-1.5 h-28 px-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-md bg-gray-200 dark:bg-white/10 animate-pulse"
                style={{ height: `${30 + Math.random() * 60}%` }}
              />
              <div className="h-2.5 w-6 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-xs text-gray-400 text-center">
            No availability slots set.
            <br />
            Add slots in the Availability section.
          </p>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-1.5 h-32">
          {data.map((day, i) => {
            const safePct = Math.min(Math.max(day.pct || 0, 0), 100);
            // height relative to max slots in week, min 6% so label is always visible
            const heightPct =
              day.total > 0 ? Math.max((day.total / maxTotal) * 100, 12) : 6;
            const filledH =
              day.total > 0 ? (day.booked / day.total) * heightPct : 0;

            return (
              <div
                key={day.label}
                className="flex-1 flex flex-col items-center gap-1 group"
              >
                {/* Tooltip on hover */}
                <div className="relative w-full flex flex-col items-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] rounded-md px-1.5 py-0.5 whitespace-nowrap z-10 pointer-events-none">
                    {day.booked}/{day.total} · {safePct}%
                  </div>

                  {/* Bar column */}
                  <div
                    className="w-full rounded-t-md overflow-hidden bg-gray-100 dark:bg-white/6 relative"
                    style={{
                      height: `${Math.max(heightPct, 6)}%`,
                      minHeight: "8px",
                    }}
                  >
                    <motion.div
                      className={`absolute bottom-0 left-0 right-0 rounded-t-md bg-gradient-to-t ${barColor(safePct, day.isToday)}`}
                      initial={{ height: 0 }}
                      animate={{
                        height: `${day.total > 0 ? (day.booked / day.total) * 100 : 0}%`,
                      }}
                      transition={{
                        duration: 0.7,
                        delay: i * 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                    {/* Today ring */}
                    {day.isToday && (
                      <div className="absolute inset-0 ring-1 ring-cyan-400/60 rounded-t-md pointer-events-none" />
                    )}
                  </div>
                </div>

                {/* Day label */}
                <div className="flex flex-col items-center gap-0.5">
                  <span
                    className={`text-[10px] font-semibold ${
                      day.isToday
                        ? "text-cyan-600 dark:text-cyan-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {day.label}
                  </span>
                  {day.isToday && (
                    <span className="h-1 w-1 rounded-full bg-cyan-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-day detail rows */}
      {!loading && data.some((d) => d.total > 0) && (
        <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-white/8">
          {data
            .filter((d) => d.total > 0 || d.appts > 0)
            .map((day, i) => {
              const safePct = Math.min(Math.max(day.pct || 0, 0), 100);
              return (
                <div key={day.label} className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-medium w-7 shrink-0 ${day.isToday ? "text-cyan-600 dark:text-cyan-400" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {day.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/8 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${barColor(safePct, day.isToday)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${safePct}%` }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.06 + 0.3,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-semibold w-8 text-right shrink-0 ${textColor(safePct, day.isToday)}`}
                  >
                    {safePct}%
                  </span>
                  <span className="text-[10px] text-gray-400 w-14 text-right shrink-0">
                    {day.appts} appt{day.appts !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
        </div>
      )}

      {/* Summary chips */}
      {summary && (
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-gray-100 dark:border-white/8">
          {[
            {
              label: "Slots",
              value: summary.totalSlots,
              color: "text-gray-700 dark:text-gray-200",
            },
            {
              label: "Booked",
              value: summary.totalBooked,
              color: "text-rose-600 dark:text-rose-400",
            },
            {
              label: "Free",
              value: summary.totalFree,
              color: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Appts",
              value: summary.totalAppts,
              color: "text-teal-600 dark:text-teal-400",
            },
          ].map(({ label, value }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="text-center"
            >
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {value ?? 0}
              </p>
              <p className="text-[10px] text-gray-400">{label}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
