import { Link } from "react-router-dom";
import { StatusBadge, PriorityBadge } from "../ui/StatusBadge";
import { formatDate } from "../../utils/formatDate";
import { displayName } from "../../utils/displayName";

const PRIORITY_ACCENT = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-400",
  low: "border-l-gray-300",
};

export default function AppointmentCard({ appointment, currentUserRole, onReschedule, onCancel }) {
  const { _id, patient, doctor, date, time, consultationType, status, priority } = appointment;

  const isPatient = currentUserRole === "patient";

  return (
    <div className={`bg-white rounded-lg shadow-sm ring-1 ring-gray-100 px-4 py-3 hover:shadow-md transition-all border-l-[3px] ${PRIORITY_ACCENT[priority] || "border-l-gray-300"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <Link to={`/appointments/${_id}`} className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
            {isPatient ? `Dr. ${displayName(doctor)}` : displayName(patient)}
          </Link>
          {doctor?.specialization && (
            <p className="text-xs text-gray-400 truncate">{doctor.specialization}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          <PriorityBadge priority={priority} />
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2.5">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(date)}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {time}
        </span>
        <span className="flex items-center gap-1 capitalize">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {consultationType}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link
          to={`/appointments/${_id}`}
          className="text-[11px] px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 font-medium ring-1 ring-gray-200/60"
        >
          View
        </Link>

        {status === "confirmed" && (
          <Link
            to={`/appointments/${_id}/chat`}
            className="text-[11px] px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 font-medium ring-1 ring-emerald-200/60"
          >
            Chat
          </Link>
        )}

        {status === "confirmed" && onReschedule && (
          <button
            onClick={() => onReschedule(appointment)}
            className="text-[11px] px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 font-medium ring-1 ring-amber-200/60"
          >
            Reschedule
          </button>
        )}

        {(status === "pending" || status === "confirmed") && onCancel && (
          <button
            onClick={() => onCancel(appointment)}
            className="text-[11px] px-2.5 py-1 bg-red-50 text-red-700 rounded-md hover:bg-red-100 font-medium ring-1 ring-red-200/60"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
