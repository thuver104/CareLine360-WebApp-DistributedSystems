import { Plus, Calendar, Download, Filter } from "lucide-react";

/**
 * QuickActionBar
 *
 * Props:
 *   onAddRecord      – () => void  → opens MedicalRecordModal
 *   onSetAvailability – () => void → switches to Availability tab
 *   onGenPrescription – () => void → opens PrescriptionModal
 *   onFilterAppts    – () => void → switches to Appointments tab or opens filter
 */
export default function QuickActionBar({
  onAddRecord,
  onSetAvailability,
  onGenPrescription,
  onFilterAppts,
}) {
  const ACTIONS = [
    { icon: Plus,     label: "Add Medical Record",    primary: true,  onClick: onAddRecord },
    { icon: Calendar, label: "Set Availability",      primary: false, onClick: onSetAvailability },
    { icon: Download, label: "Generate Prescription", primary: false, onClick: onGenPrescription },
    { icon: Filter,   label: "Filter Appointments",   primary: false, onClick: onFilterAppts },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {ACTIONS.map(({ icon: Icon, label, primary, onClick }) => (
        <button
          key={label}
          onClick={onClick}
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