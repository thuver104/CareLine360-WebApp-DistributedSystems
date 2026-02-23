import { SLOT_DATA } from "../../utils/dashboardData";
import { COLORS } from "../../utils/colors";

export default function SlotUtilisation() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
        Slot Utilisation
      </h2>

      <div className="space-y-5">
        {SLOT_DATA.map(({ label, pct, colorKey }) => {
          const c = COLORS[colorKey] || COLORS.teal;
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {label}
                </span>
                <span className={`text-xs font-bold ${c.text}`}>{pct}%</span>
              </div>
              {/* Track */}
              <div className="relative h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                {/* Fill */}
                <div
                  className={`h-full rounded-full ${c.bar} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
                    width: `${pct}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-5 pt-4 border-t border-gray-200 dark:border-white/10 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Total Slots", value: "24" },
          { label: "Booked",      value: "16" },
          { label: "Free",        value: "8"  },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-base font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-[10px] text-gray-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}