import { useState } from "react";

const STATUS_PILLS = [
  { value: "", label: "All", icon: null },
  { value: "pending", label: "Pending", dot: "bg-amber-400" },
  { value: "confirmed", label: "Confirmed", dot: "bg-sky-500" },
];

const SORT_OPTIONS = [
  { value: "-date", label: "Newest" },
  { value: "date", label: "Oldest" },
  { value: "-priority", label: "Priority" },
];

export default function AppointmentFilters({ filters, onChange }) {
  const [showDates, setShowDates] = useState(!!(filters.dateFrom || filters.dateTo));

  const set = (key, val) => onChange({ ...filters, [key]: val, page: 1 });

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl ring-1 ring-black/[0.04] shadow-sm px-4 py-3.5 mb-5">
      {/* Status pills + sort */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          {STATUS_PILLS.map((s) => (
            <button
              key={s.value}
              onClick={() => set("status", s.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                filters.status === s.value || (!filters.status && s.value === "")
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm shadow-blue-500/20"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              {s.dot && (
                <span className={`w-1.5 h-1.5 rounded-full ${
                  filters.status === s.value ? "bg-white/80" : s.dot
                }`} />
              )}
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Date toggle */}
          <button
            onClick={() => setShowDates((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showDates
                ? "bg-blue-50 text-blue-600"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Dates
          </button>

          {/* Sort */}
          <div className="flex items-center bg-gray-50 rounded-lg ring-1 ring-gray-200/60 overflow-hidden">
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => set("sort", s.value)}
                className={`px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  filters.sort === s.value
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date range — collapsible */}
      {showDates && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom || ""}
            onChange={(e) => set("dateFrom", e.target.value)}
            className="h-8 rounded-lg border border-gray-200 bg-gray-50/50 px-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 transition-shadow"
          />
          <span className="text-[10px] text-gray-300 font-medium">to</span>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo || ""}
            onChange={(e) => set("dateTo", e.target.value)}
            className="h-8 rounded-lg border border-gray-200 bg-gray-50/50 px-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 transition-shadow"
          />
          {(filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => {
                onChange({ ...filters, dateFrom: "", dateTo: "", page: 1 });
              }}
              className="text-[10px] text-gray-400 hover:text-rose-500 font-medium transition-colors ml-1"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
