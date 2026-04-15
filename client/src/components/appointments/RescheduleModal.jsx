import { useState } from "react";
import Modal from "../ui/Modal";
import { useToast } from "../../context/ToastContext";
import { rescheduleAppointment } from "../../api/appointmentApi";
import { TIME_SLOTS } from "../../utils/constants";

const inputClass =
  "w-full h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 text-sm text-gray-800 dark:text-gray-200 " +
  "focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition shadow-sm";

export default function RescheduleModal({ appointment, isOpen, onClose, onRescheduled }) {
  const toast = useToast();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await rescheduleAppointment(appointment._id, date, time);
      toast.success("Appointment rescheduled successfully");
      onRescheduled(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reschedule");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reschedule Appointment">
      {error && <div className="mb-3 p-2 bg-red-50 dark:bg-rose-900/30 text-red-700 dark:text-rose-300 text-sm rounded-xl">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Time</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">Select time</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 bg-[#0d9488] text-white text-sm font-medium rounded-xl hover:bg-[#0b7c72] active:scale-[0.98] disabled:opacity-50 transition shadow-sm"
          >
            {submitting ? "Rescheduling..." : "Reschedule"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-white/15 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
