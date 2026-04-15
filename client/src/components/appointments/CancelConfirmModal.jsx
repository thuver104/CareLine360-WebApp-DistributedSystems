import { useState } from "react";
import Modal from "../ui/Modal";
import { useToast } from "../../context/ToastContext";
import { cancelAppointment } from "../../api/appointmentApi";

export default function CancelConfirmModal({ appointment, isOpen, onClose, onCancelled }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await cancelAppointment(appointment._id, reason);
      toast.success("Appointment cancelled");
      onCancelled(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Appointment">
      {error && <div className="mb-3 p-2 bg-red-50 dark:bg-rose-900/30 text-red-700 dark:text-rose-300 text-sm rounded-xl">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to cancel this appointment? This action cannot be undone.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for cancellation</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={3}
            placeholder="Please provide a reason..."
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition shadow-sm"
          />
        </div>
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 transition shadow-sm"
          >
            {submitting ? "Cancelling..." : "Confirm Cancel"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-white/15 transition"
          >
            Go Back
          </button>
        </div>
      </form>
    </Modal>
  );
}
