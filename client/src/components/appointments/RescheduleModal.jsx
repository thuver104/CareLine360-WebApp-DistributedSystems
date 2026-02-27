import { useState } from "react";
import Modal from "../ui/Modal";
import { useToast } from "../../context/ToastContext";
import { rescheduleAppointment } from "../../api/appointmentApi";
import { TIME_SLOTS } from "../../utils/constants";

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
      {error && <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
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
            className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {submitting ? "Rescheduling..." : "Reschedule"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
