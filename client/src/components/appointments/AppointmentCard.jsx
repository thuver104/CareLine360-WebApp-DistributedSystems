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
    <div className={`bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5 hover:shadow-md hover:ring-gray-200 transition-all border-l-4 ${PRIORITY_ACCENT[priority] || "border-l-gray-300"}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <Link to={`/appointments/${_id}`} className="text-blue-600 hover:text-blue-800 font-semibold text-base">
            {isPatient ? `Dr. ${displayName(doctor)}` : displayName(patient)}
          </Link>
          <p className="text-sm text-gray-400 mt-0.5">{doctor?.specialization}</p>
        </div>
        <div className="flex space-x-2">
          <PriorityBadge priority={priority} />
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-1.5">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(date)}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{time}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="capitalize">{consultationType}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to={`/appointments/${_id}`}
          className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium ring-1 ring-gray-200/60"
        >
          View Details
        </Link>

        {status === "confirmed" && (
          <Link
            to={`/appointments/${_id}/chat`}
            className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium ring-1 ring-emerald-200/60"
          >
            Chat
          </Link>
        )}

        {status === "confirmed" && onReschedule && (
          <button
            onClick={() => onReschedule(appointment)}
            className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 font-medium ring-1 ring-amber-200/60"
          >
            Reschedule
          </button>
        )}

        {(status === "pending" || status === "confirmed") && onCancel && (
          <button
            onClick={() => onCancel(appointment)}
            className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium ring-1 ring-red-200/60"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
