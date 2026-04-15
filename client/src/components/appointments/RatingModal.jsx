import { useState } from "react";
import { Star } from "lucide-react";
import Modal from "../ui/Modal";
import { useToast } from "../../context/ToastContext";
import { submitRating } from "../../api/appointmentApi";

export default function RatingModal({ appointmentId, existingRating, isOpen, onClose, onRated }) {
  const toast = useToast();
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState(existingRating?.review || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isReadOnly = !!existingRating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await submitRating(appointmentId, { rating, review });
      toast.success("Rating submitted successfully");
      onRated(res.data.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit rating";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isReadOnly ? "Your Rating" : "Rate This Consultation"}>
      {error && <div className="mb-3 p-2 bg-red-50 dark:bg-rose-900/30 text-red-700 dark:text-rose-300 text-sm rounded-xl">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star selector */}
        <div className="flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= (hovered || rating);
            return (
              <button
                key={star}
                type="button"
                disabled={isReadOnly}
                onClick={() => !isReadOnly && setRating(star)}
                onMouseEnter={() => !isReadOnly && setHovered(star)}
                onMouseLeave={() => !isReadOnly && setHovered(0)}
                className={`transition-transform ${isReadOnly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"}`}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    filled
                      ? "text-amber-400 fill-amber-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              </button>
            );
          })}
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {rating > 0 ? `${rating} out of 5 stars` : "Select a rating"}
        </p>

        {/* Review textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Review (optional)</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            disabled={isReadOnly}
            rows={3}
            placeholder="Share your experience..."
            maxLength={500}
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition shadow-sm disabled:opacity-60"
          />
        </div>

        {!isReadOnly && (
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 py-2.5 bg-[#0d9488] text-white text-sm font-medium rounded-xl hover:bg-[#0b7c72] active:scale-[0.98] disabled:opacity-50 transition shadow-sm"
            >
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-white/15 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}
