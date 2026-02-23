import { Download, FilePlus } from "lucide-react";
import { MEDICAL_RECORDS } from "../../utils/dashboardData";
import { getInitials } from "../../utils/colors";

export default function MedicalRecordsGrid() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Recent Medical Records
        </h2>
        <button className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium">
          <FilePlus className="h-3.5 w-3.5" />
          View All Records →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MEDICAL_RECORDS.map((rec) => (
          <div
            key={rec.id}
            className="record-card group rounded-xl p-4 cursor-pointer
              border border-white/10 hover:border-teal-400/30
              bg-white/20 dark:bg-white/5
              hover:bg-white/40 dark:hover:bg-white/10
              backdrop-blur-sm
              transition-all duration-200 hover:shadow-md hover:shadow-teal-500/10
              hover:-translate-y-0.5"
          >
            {/* Patient avatar + name */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 ring-2 ring-teal-400/20 group-hover:ring-teal-400/40 transition-all">
                {getInitials(rec.patient)}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {rec.patient}
              </p>
            </div>

            {/* Diagnosis */}
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug line-clamp-2 mb-3">
              {rec.diagnosis}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/10">
              <p className="text-[10px] text-gray-400">{rec.date}</p>
              {rec.hasPrescription ? (
                <button className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors active:scale-95">
                  <Download className="h-3 w-3" />
                  PDF
                </button>
              ) : (
                <span className="text-[10px] text-gray-400 dark:text-gray-600">No Rx</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}