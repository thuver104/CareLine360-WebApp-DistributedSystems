import { CheckCircle, XCircle, FileText } from "lucide-react";
import { APPOINTMENTS } from "../../utils/dashboardData";
import { PRIORITY_BADGE, STATUS_BADGE, getInitials } from "../../utils/colors";

export default function AppointmentsTable() {
  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Today's Appointments
        </h2>
        <button className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium transition-colors">
          View All →
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10 text-left">
              {["Patient", "Time", "Type", "Priority", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className="pb-3 pr-4 text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {APPOINTMENTS.map((apt) => (
              <tr
                key={apt.id}
                className="group border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {/* Patient */}
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-teal-400/20">
                      {getInitials(apt.patient)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                        {apt.patient}
                      </p>
                      <p className="text-[10px] text-gray-400">{apt.id}</p>
                    </div>
                  </div>
                </td>

                {/* Time */}
                <td className="py-3.5 pr-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {apt.time}
                </td>

                {/* Type */}
                <td className="py-3.5 pr-4 text-sm text-gray-600 dark:text-gray-300">
                  {apt.type}
                </td>

                {/* Priority */}
                <td className="py-3.5 pr-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${PRIORITY_BADGE[apt.priority]}`}>
                    {apt.priority}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 pr-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[apt.status]}`}>
                    {apt.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3.5">
                  <div className="flex items-center gap-1.5">
                    {apt.status === "REQUESTED" && (
                      <>
                        <button
                          title="Accept"
                          className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition-colors active:scale-95"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Reject"
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors active:scale-95"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {apt.status === "ACCEPTED" && (
                      <button
                        title="Add Medical Record"
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors active:scale-95"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {apt.status === "COMPLETED" && (
                      <span className="text-[11px] text-gray-400">Done</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}