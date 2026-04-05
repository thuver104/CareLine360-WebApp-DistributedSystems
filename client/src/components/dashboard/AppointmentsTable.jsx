import {
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  Pill,
  ClipboardList,
  CircleCheck,
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
 *   onComplete     – (appointmentId) => void  — mark appointment as completed
 *   onViewAll      – () => void
 */
export default function AppointmentsTable({
  appointments = [],
  loading = false,
  title = "Today's Appointments",
  showDate = false,
  onConfirm,
  onCancel,
  onDelete,
  onAddRecord,
  onPrescription,
  onChat,
  onViewRecords,
  onComplete,
  onViewAll,
}) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
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
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="text-left bg-black/10 dark:bg-white/[0.03]">
                {[
                  "Patient",
                  ...(showDate ? ["Date"] : []),
                  "Time",
                  "Type",
                  "Priority",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-3 first:rounded-l-lg last:rounded-r-lg text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => {
                const patientName =
                  apt.patientProfile?.fullName ||
                  apt.patientName ||
                  apt.patient?.email ||
                  "Unknown Patient";
                const patientId = apt.patientProfile?.patientId || "";
                const avatarUrl = apt.patientProfile?.avatarUrl || null;
                // Initials: first char of each word, max 2
                const initials =
                  getInitials(patientName) ||
                  patientName[0]?.toUpperCase() ||
                  "?";

                return (
                  <tr
                    key={apt._id}
                    className="group align-top border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    {/* Patient */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        {/* Avatar: photo if available, else initials */}
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={patientName}
                            className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-teal-400/20"
                          />
                        ) : (
                          <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-teal-400/20">
                            {initials}
                          </div>
                        )}
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

                    {/* Date */}
                    {showDate && (
                      <td className="py-3.5 px-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {apt.date
                          ? new Date(apt.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                    )}

                    {/* Time */}
                    <td className="py-3.5 px-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {apt.time || "—"}
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-3 text-sm text-gray-600 dark:text-gray-300 capitalize">
                      {apt.consultationType || apt.type || "—"}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-3">
                      {apt.priority && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${PRIORITY_BADGE[apt.priority] || PRIORITY_BADGE.low}`}
                        >
                          {apt.priority}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${STATUS_BADGE[apt.status] || ""}`}
                      >
                        {apt.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3">
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                        <div className="grid grid-cols-3 gap-2">
                          {/* View patient past records — always available */}
                          <ActionIcon
                            icon={<ClipboardList className="h-5 w-5" />}
                            label="Records"
                            color="amber"
                            onClick={() => onViewRecords?.(apt)}
                          />

                          {apt.status === "pending" && (
                            <>
                              <ActionIcon
                                icon={<CheckCircle className="h-5 w-5" />}
                                label="Confirm"
                                color="teal"
                                onClick={() => onConfirm?.(apt._id)}
                              />
                              <ActionIcon
                                icon={<XCircle className="h-5 w-5" />}
                                label="Cancel"
                                color="rose"
                                onClick={() => onCancel?.(apt._id)}
                              />
                            </>
                          )}
                          {apt.status === "confirmed" && (
                            <>
                              <ActionIcon
                                icon={<CircleCheck className="h-5 w-5" />}
                                label="Complete"
                                color="emerald"
                                onClick={() => onComplete?.(apt._id)}
                              />
                              <ActionIcon
                                icon={<FileText className="h-5 w-5" />}
                                label="Record"
                                color="blue"
                                onClick={() => onAddRecord?.(apt)}
                              />
                              <ActionIcon
                                icon={<Pill className="h-5 w-5" />}
                                label="Prescribe"
                                color="violet"
                                onClick={() => onPrescription?.(apt)}
                              />
                              <ActionIcon
                                icon={<MessageSquare className="h-5 w-5" />}
                                label="Chat"
                                color="gray"
                                onClick={() => onChat?.(apt)}
                              />
                            </>
                          )}
                          {apt.status === "completed" && (
                            <>
                              <button
                                disabled
                                className="inline-flex h-10 w-[112px] items-center justify-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-500/10 text-xs font-semibold text-emerald-500 dark:text-emerald-300 cursor-default"
                              >
                                <CircleCheck className="h-4 w-4" /> Done
                              </button>
                              <ActionIcon
                                icon={<Trash2 className="h-5 w-5" />}
                                label="Delete"
                                color="danger"
                                onClick={() => onDelete?.(apt._id)}
                              />
                            </>
                          )}

                          {/* Delete — for non-completed appointments */}
                          {apt.status !== "completed" && (
                            <ActionIcon
                              icon={<Trash2 className="h-5 w-5" />}
                              label="Delete"
                              color="danger"
                              onClick={() => onDelete?.(apt._id)}
                            />
                          )}
                        </div>
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
  teal: "border border-teal-400/35 bg-teal-500/10 text-teal-500 dark:text-teal-300 hover:bg-teal-500/20",
  rose: "border border-rose-400/35 bg-rose-500/10 text-rose-500 dark:text-rose-300 hover:bg-rose-500/20",
  blue: "border border-blue-400/35 bg-blue-500/10 text-blue-500 dark:text-blue-300 hover:bg-blue-500/20",
  violet:
    "border border-violet-400/35 bg-violet-500/10 text-violet-500 dark:text-violet-300 hover:bg-violet-500/20",
  amber:
    "border border-amber-400/35 bg-amber-500/10 text-amber-500 dark:text-amber-300 hover:bg-amber-500/20",
  emerald:
    "border border-emerald-400/35 bg-emerald-500/10 text-emerald-500 dark:text-emerald-300 hover:bg-emerald-500/20",
  gray: "border border-slate-400/35 bg-slate-500/10 text-slate-400 dark:text-slate-300 hover:bg-slate-500/20",
  danger:
    "border border-rose-400/35 bg-rose-500/10 text-rose-500 dark:text-rose-300 hover:bg-rose-500/20",
};

/**
 * Static action button — always displays icon and label without animations.
 */
function ActionIcon({ icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex h-10 w-[112px] items-center justify-center gap-1.5
        rounded-md
        text-xs font-semibold
        cursor-pointer
        transition-colors
        ${COLOR_CLASSES[color] || COLOR_CLASSES.gray}
      `}
    >
      {/* Icon */}
      <span className="flex items-center shrink-0">{icon}</span>

      {/* Label — always visible */}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
