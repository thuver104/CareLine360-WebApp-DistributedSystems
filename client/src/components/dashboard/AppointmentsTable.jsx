import {
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  Pill,
  ClipboardList,
} from "lucide-react";
import { PRIORITY_BADGE, STATUS_BADGE, getInitials } from "../../utils/colors";

/**
 * AppointmentsTable
 *
 * Props:
 *   appointments  – array from getDoctorAppointments() API
 *   loading       – boolean
 *   onConfirm     – (appointmentId) => void
 *   onCancel      – (appointmentId) => void
 *   onDelete      – (appointmentId) => void
 *   onAddRecord    – (appointment) => void
 *   onPrescription – (appointment) => void
 *   onChat         – (appointment) => void
 *   onViewRecords  – (appointment) => void  — view patient's past medical records
 *   onViewAll      – () => void
 */
export default function AppointmentsTable({
  appointments = [],
  loading = false,
  onConfirm,
  onCancel,
  onDelete,
  onAddRecord,
  onPrescription,
  onChat,
  onViewRecords,
  onViewAll,
}) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Today's Appointments
        </h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium transition-colors"
          >
            View All →
          </button>
        )}
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-3 animate-pulse"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 rounded bg-gray-200 dark:bg-white/10 w-1/3" />
                  <div className="h-2.5 rounded bg-gray-200 dark:bg-white/10 w-1/5" />
                </div>
                <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-white/10" />
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No appointments scheduled for today.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 text-left">
                {[
                  "Patient",
                  "Time",
                  "Type",
                  "Priority",
                  "Status",
                  "Actions",
                ].map((h) => (
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
              {appointments.map((apt) => {
                const patientName =
                  apt.patientProfile?.fullName || apt.patientName || "—";
                const patientId = apt.patientProfile?.patientId || "";

                return (
                  <tr
                    key={apt._id}
                    className="group border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    {/* Patient */}
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-teal-400/20">
                          {getInitials(patientName)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                            {patientName}
                          </p>
                          {patientId && (
                            <p className="text-[10px] text-gray-400">
                              {patientId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="py-3.5 pr-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {apt.time || "—"}
                    </td>

                    {/* Type */}
                    <td className="py-3.5 pr-4 text-sm text-gray-600 dark:text-gray-300 capitalize">
                      {apt.consultationType || apt.type || "—"}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 pr-4">
                      {apt.priority && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${PRIORITY_BADGE[apt.priority] || PRIORITY_BADGE.low}`}
                        >
                          {apt.priority}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 pr-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${STATUS_BADGE[apt.status] || ""}`}
                      >
                        {apt.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        {/* View patient past records — always available */}
                        <ActionIcon
                          icon={<ClipboardList className="h-4.5 w-4.5" />}
                          title="View Patient's Past Records"
                          color="amber"
                          onClick={() => onViewRecords?.(apt)}
                        />

                        {apt.status === "pending" && (
                          <>
                            <ActionIcon
                              icon={<CheckCircle className="h-4.5 w-4.5" />}
                              title="Confirm"
                              color="teal"
                              onClick={() => onConfirm?.(apt._id)}
                            />
                            <ActionIcon
                              icon={<XCircle className="h-4.5 w-4.5" />}
                              title="Cancel"
                              color="rose"
                              onClick={() => onCancel?.(apt._id)}
                            />
                          </>
                        )}
                        {apt.status === "confirmed" && (
                          <>
                            <ActionIcon
                              icon={<FileText className="h-4.5 w-4.5" />}
                              title="Add Medical Record"
                              color="blue"
                              onClick={() => onAddRecord?.(apt)}
                            />
                            <ActionIcon
                              icon={<Pill className="h-4.5 w-4.5" />}
                              title="Generate Prescription"
                              color="violet"
                              onClick={() => onPrescription?.(apt)}
                            />
                            <ActionIcon
                              icon={<MessageSquare className="h-4.5 w-4.5" />}
                              title="Chat"
                              color="gray"
                              onClick={() => onChat?.(apt)}
                            />
                          </>
                        )}
                        {apt.status === "completed" && (
                          <span className="text-[11px] text-gray-400">
                            Done
                          </span>
                        )}

                        {/* Delete — only for non-completed appointments */}
                        {apt.status !== "completed" && (
                          <ActionIcon
                            icon={<Trash2 className="h-4.5 w-4.5" />}
                            title="Delete Appointment"
                            color="danger"
                            onClick={() => onDelete?.(apt._id)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const COLOR_CLASSES = {
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
  violet:
    "bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20",
  amber:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
  gray: "bg-gray-500/10 text-gray-600 dark:text-gray-400 hover:bg-gray-500/20",
  danger:
    "bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-500/25 border border-rose-300/40 dark:border-rose-500/30",
};

function ActionIcon({ icon, title, color, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-2 rounded-lg transition-all active:scale-95 ${COLOR_CLASSES[color] || COLOR_CLASSES.gray}`}
    >
      {icon}
    </button>
  );
}
