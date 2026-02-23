import { Plus, Calendar, Download, Filter } from "lucide-react";

const ACTIONS = [
  { icon: Plus,     label: "Add Medical Record",    primary: true  },
  { icon: Calendar, label: "Set Availability",      primary: false },
  { icon: Download, label: "Generate Prescription", primary: false },
  { icon: Filter,   label: "Filter Appointments",   primary: false },
];

export default function QuickActionBar() {
  return (
    <div className="flex flex-wrap gap-3">
      {ACTIONS.map(({ icon: Icon, label, primary }) => (
        <button
          key={label}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
            primary
              ? "bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/25"
              : "glass-btn text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:ring-1 hover:ring-teal-400/40"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}