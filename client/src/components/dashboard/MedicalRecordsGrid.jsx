import { Download, FilePlus, FileX } from "lucide-react";
import { getInitials } from "../../utils/colors";

/**
 * MedicalRecordsGrid
 *
 * Props:
 *   records  – array from API:
 *     [{ _id, patient: { fullName }, diagnosis, createdAt, prescriptions[] }]
 *   loading  – boolean
 *   onViewAll – callback
 *   onDownload – (record) => void
 */
export default function MedicalRecordsGrid({
  records = [],
  loading = false,
  onViewAll,
  onDownload,
}) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Recent Medical Records
        </h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            <FilePlus className="h-3.5 w-3.5" />
            View All Records →
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl p-4 border border-gray-100 dark:border-white/10 animate-pulse space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10" />
                <div className="h-3 rounded bg-gray-200 dark:bg-white/10 flex-1" />
              </div>
              <div className="h-2.5 rounded bg-gray-200 dark:bg-white/10 w-full" />
              <div className="h-2.5 rounded bg-gray-200 dark:bg-white/10 w-2/3" />
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
          <FileX className="h-8 w-8 opacity-30" />
          <p className="text-sm">No medical records yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {records.map((rec) => {
            const patientName =
              rec.patient?.fullName ||
              rec.patientName ||
              "Unknown Patient";
            const hasPrescription =
              rec.prescriptions?.length > 0 || rec.hasPrescription;
            const dateStr = rec.createdAt
              ? new Date(rec.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : rec.date || "—";

            return (
              <div
                key={rec._id}
                className="record-card group rounded-xl p-4 cursor-pointer
                  border border-white/10 hover:border-teal-400/30
                  bg-white/20 dark:bg-white/5
                  hover:bg-white/40 dark:hover:bg-white/10
                  backdrop-blur-sm
                  transition-all duration-200
                  hover:shadow-md hover:shadow-teal-500/10
                  hover:-translate-y-0.5"
              >
                {/* Patient avatar + name */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 ring-2 ring-teal-400/20 group-hover:ring-teal-400/40 transition-all">
                    {getInitials(patientName)}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {patientName}
                  </p>
                </div>

                {/* Diagnosis */}
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug line-clamp-2 mb-3">
                  {rec.diagnosis || "—"}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/10">
                  <p className="text-[10px] text-gray-400">{dateStr}</p>
                  {hasPrescription ? (
                    <button
                      onClick={() => onDownload?.(rec)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors active:scale-95"
                    >
                      <Download className="h-3 w-3" />
                      PDF
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-400 dark:text-gray-600">
                      No Rx
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}