import { Calendar, Clock, Video, User, Phone, Stethoscope, AlertTriangle } from "lucide-react";
import { PriorityBadge } from "../ui/StatusBadge";
import { formatDate } from "../../utils/formatDate";

const TYPE_ICONS = { video: Video, "in-person": User, phone: Phone };

export default function ConfirmStep({ doctor, date, time, consultationType, symptoms, priority, notes, onEdit, onConfirm, submitting }) {
  const TypeIcon = TYPE_ICONS[consultationType] || Video;

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Confirm Booking</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Review your appointment details before confirming.</p>

      <div className="space-y-4">
        {/* Doctor */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#0d9488]" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Doctor</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Dr. {doctor?.fullName || "Selected"}</p>
              {doctor?.specialization && <p className="text-xs text-gray-400 dark:text-gray-500">{doctor.specialization}</p>}
            </div>
          </div>
          <button onClick={() => onEdit(1)} className="text-xs text-[#0d9488] dark:text-teal-400 hover:underline">Edit</button>
        </div>

        {/* Date & Time */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0d9488]" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Date & Time</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(date)} at {time}</p>
            </div>
          </div>
          <button onClick={() => onEdit(2)} className="text-xs text-[#0d9488] dark:text-teal-400 hover:underline">Edit</button>
        </div>

        {/* Consultation Type */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-[#0d9488]" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Consultation Type</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{consultationType}</p>
            </div>
          </div>
          <button onClick={() => onEdit(2)} className="text-xs text-[#0d9488] dark:text-teal-400 hover:underline">Edit</button>
        </div>

        {/* Symptoms & Priority */}
        {symptoms && (
          <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-[#0d9488]" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Symptoms</p>
              <PriorityBadge priority={priority} />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 ml-6">{symptoms}</p>
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{notes}</p>
          </div>
        )}
      </div>

      <button
        onClick={onConfirm}
        disabled={submitting}
        className="w-full mt-6 py-2.5 bg-[#0d9488] text-white text-sm font-medium rounded-xl hover:bg-[#0b7c72] active:scale-[0.98] disabled:opacity-50 transition shadow-sm"
      >
        {submitting ? "Booking..." : "Confirm & Book Appointment"}
      </button>
    </div>
  );
}
