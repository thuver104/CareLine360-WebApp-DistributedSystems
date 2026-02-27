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
      {error && <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to cancel this appointment? This action cannot be undone.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason for cancellation</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={3}
            placeholder="Please provide a reason..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 shadow-sm"
          >
            {submitting ? "Cancelling..." : "Confirm Cancel"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
          >
            Go Back
          </button>
        </div>
      </form>
    </Modal>
  );
}
