import { Link } from "react-router-dom";
import { Calendar, Clock, Video, User, Phone, MessageSquare, RefreshCw, X, ChevronRight } from "lucide-react";
import { StatusBadge, PriorityBadge } from "../ui/StatusBadge";
import { formatDate } from "../../utils/formatDate";
import { displayName } from "../../utils/displayName";
import { getInitials } from "../../utils/colors";

const PRIORITY_ACCENT = {
  urgent: "border-l-rose-500",
  high: "border-l-orange-500",
  medium: "border-l-amber-400",
  low: "border-l-gray-300 dark:border-l-gray-600",
};

const TYPE_ICON = { video: Video, "in-person": User, phone: Phone };
const TYPE_LABEL = { video: "Video Call", "in-person": "In Person", phone: "Phone Call" };

export default function AppointmentCard({ appointment, currentUserRole, onReschedule, onCancel, onConfirm, onComplete }) {
  const { _id, patient, doctor, date, time, consultationType, status, priority } = appointment;
  const isPatient = currentUserRole === "patient";
  const TypeIcon = TYPE_ICON[consultationType] || Video;
  const personName = isPatient ? displayName(doctor) : displayName(patient);

  return (
    <div className={`glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 ${PRIORITY_ACCENT[priority] || "border-l-gray-300 dark:border-l-gray-600"} group`}>
      <div className="p-5">
        {/* Top row: avatar + name + badges */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0d9488] to-[#06b6d4] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
            {getInitials(personName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link to={`/appointments/${_id}`} className="text-[#0d9488] dark:text-teal-400 hover:text-[#0b7c72] dark:hover:text-teal-300 font-semibold text-[15px] transition block truncate">
                  {isPatient ? `Dr. ${personName}` : personName}
                </Link>
                {isPatient && doctor?.specialization && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{doctor.specialization}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <PriorityBadge priority={priority} />
                <StatusBadge status={status} />
              </div>
            </div>
          </div>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg ring-1 ring-gray-100 dark:ring-white/10">
            <Calendar className="w-3.5 h-3.5 text-[#0d9488]" />
            {formatDate(date)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg ring-1 ring-gray-100 dark:ring-white/10">
            <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
            {time}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg ring-1 ring-gray-100 dark:ring-white/10">
            <TypeIcon className="w-3.5 h-3.5 text-[#0d9488]" />
            {TYPE_LABEL[consultationType] || consultationType}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {status === "confirmed" && (
              <Link
                to={`/appointments/${_id}/chat`}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-medium ring-1 ring-emerald-200/60 dark:ring-emerald-500/20 transition"
              >
                <MessageSquare className="w-3 h-3" /> Chat
              </Link>
            )}

            {status === "confirmed" && onReschedule && (
              <button
                onClick={() => onReschedule(appointment)}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 font-medium ring-1 ring-amber-200/60 dark:ring-amber-500/20 transition"
              >
                <RefreshCw className="w-3 h-3" /> Reschedule
              </button>
            )}

            {(status === "pending" || status === "confirmed") && onCancel && (
              <button
                onClick={() => onCancel(appointment)}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 dark:bg-rose-900/30 text-red-700 dark:text-rose-300 rounded-xl hover:bg-red-100 dark:hover:bg-rose-900/50 font-medium ring-1 ring-red-200/60 dark:ring-rose-500/20 transition"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            )}

            {onConfirm && status === "pending" && (
              <button
                onClick={() => onConfirm(appointment)}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-[#0d9488] text-white rounded-xl hover:bg-[#0b7c72] active:scale-[0.98] font-medium shadow-sm transition"
              >
                Confirm
              </button>
            )}

            {onComplete && status === "confirmed" && (
              <button
                onClick={() => onComplete(appointment)}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-[0.98] font-medium shadow-sm transition"
              >
                Complete
              </button>
            )}
          </div>

          <Link
            to={`/appointments/${_id}`}
            className="inline-flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500 hover:text-[#0d9488] dark:hover:text-teal-400 font-medium transition opacity-0 group-hover:opacity-100"
          >
            Details <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
