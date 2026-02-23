import {
  CheckCircle,
  FileText,
  AlertTriangle,
  Users,
  Star,
} from "lucide-react";
import { ACTIVITY_FEED } from "../../utils/dashboardData";
import { COLORS } from "../../utils/colors";

const ICON_MAP = {
  completed:   CheckCircle,
  prescription: FileText,
  alert:       AlertTriangle,
  patient:     Users,
  review:      Star,
};

export default function ActivityFeed() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h2>
        <button className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium">
          See all →
        </button>
      </div>

      <div className="space-y-3">
        {ACTIVITY_FEED.map((item, i) => {
          const Icon = ICON_MAP[item.type] || CheckCircle;
          const c = COLORS[item.colorKey] || COLORS.teal;

          return (
            <div
              key={i}
              className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/30 dark:hover:bg-white/5 transition-colors cursor-default"
            >
              {/* Icon blob */}
              <div className={`shrink-0 p-2 rounded-lg ${c.bg} ring-1 ${c.ring}`}>
                <Icon className={`h-3.5 w-3.5 ${c.text}`} />
              </div>

              {/* Text */}
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
    </div>
  );
}