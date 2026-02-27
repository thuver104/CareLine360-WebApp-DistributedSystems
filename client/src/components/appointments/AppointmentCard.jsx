import { Link } from "react-router-dom";
import { formatDate } from "../../utils/formatDate";
import { displayName } from "../../utils/displayName";

const STATUS_STYLE = {
  pending: "bg-amber-50 text-amber-600 ring-amber-200/60",
  confirmed: "bg-sky-50 text-sky-600 ring-sky-200/60",
  completed: "bg-emerald-50 text-emerald-600 ring-emerald-200/60",
  cancelled: "bg-rose-50 text-rose-500 ring-rose-200/60",
};

const PRIORITY_STYLE = {
  low: "bg-gray-50 text-gray-500 ring-gray-200/60",
  medium: "bg-amber-50 text-amber-600 ring-amber-200/60",
  high: "bg-orange-50 text-orange-600 ring-orange-200/60",
  urgent: "bg-red-50 text-red-600 ring-red-200/60",
};

const PRIORITY_DOT = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-gray-300",
};

const TYPE_ICON = {
  "in-person": (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  video: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  phone: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
};

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function AppointmentCard({ appointment, currentUserRole, onReschedule, onCancel }) {
  const { _id, patient, doctor, date, time, consultationType, status, priority } = appointment;
  const isPatient = currentUserRole === "patient";
  const name = isPatient ? displayName(doctor) : displayName(patient);
  const initials = getInitials(name);

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm ring-1 ring-black/[0.04] hover:shadow-lg hover:shadow-blue-500/[0.06] hover:ring-blue-200/40 transition-all duration-300 overflow-hidden">
      {/* Priority accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${PRIORITY_DOT[priority] || "bg-gray-200"}`} />

      <div className="pl-5 pr-4 py-4 flex items-start gap-3.5">
        {/* Avatar */}
        <div className="shrink-0 relative">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
            {initials}
          </div>
          {/* Online dot for confirmed */}
          {status === "confirmed" && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0">
              <Link
                to={`/appointments/${_id}`}
                className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate block"
              >
                {isPatient ? `Dr. ${name}` : name}
              </Link>
              {isPatient && doctor?.specialization && (
                <p className="text-[11px] text-gray-400 truncate">{doctor.specialization}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 capitalize ${PRIORITY_STYLE[priority] || PRIORITY_STYLE.low}`}>
                {priority}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 capitalize ${STATUS_STYLE[status] || ""}`}>
                {status}
              </span>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3">
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(date)}
            </span>
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {time}
            </span>
            <span className="inline-flex items-center gap-1 capitalize">
              {TYPE_ICON[consultationType] || TYPE_ICON["in-person"]}
              {consultationType}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              to={`/appointments/${_id}`}
              className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 ring-1 ring-gray-200/60 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </Link>

            {status === "confirmed" && (
              <Link
                to={`/appointments/${_id}/chat`}
                className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-sm shadow-blue-500/20 transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat
              </Link>
            )}

            {status === "confirmed" && onReschedule && (
              <button
                onClick={() => onReschedule(appointment)}
                className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 ring-1 ring-amber-200/60 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reschedule
              </button>
            )}

            {(status === "pending" || status === "confirmed") && onCancel && (
              <button
                onClick={() => onCancel(appointment)}
                className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 ring-1 ring-rose-200/60 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
