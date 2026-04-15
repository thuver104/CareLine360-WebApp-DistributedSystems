import { useState, useEffect } from "react";
import { getUsers } from "../../api/userApi";
import { createAppointment } from "../../api/appointmentApi";
import { CONSULTATION_TYPES, TIME_SLOTS } from "../../utils/constants";
import { useToast } from "../../context/ToastContext";
import { displayName } from "../../utils/displayName";

const inputClass =
  "w-full h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 text-sm text-gray-800 dark:text-gray-200 " +
  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition shadow-sm";

export default function BookingForm({ symptoms, priority, onBooked }) {
  const toast = useToast();
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    doctor: "",
    date: "",
    time: "",
    consultationType: "video",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getUsers("doctor")
      .then((res) => setDoctors(res.data.data))
      .catch((err) => console.error("Failed to load doctors:", err));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = {
        doctor: form.doctor,
        date: form.date,
        time: form.time,
        consultationType: form.consultationType,
        symptoms: symptoms || "",
        notes: form.notes,
        priority: priority || "low",
      };

      const res = await createAppointment(data);
      onBooked(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to book appointment";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Book Appointment</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-rose-900/30 text-red-700 dark:text-rose-300 text-sm rounded-xl">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor</label>
          <select
            name="doctor"
            value={form.doctor}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="">Select a doctor</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {displayName(doc)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              min={today}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
            <select
              name="time"
              value={form.time}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">Select time</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Consultation Type</label>
          <select
            name="consultationType"
            value={form.consultationType}
            onChange={handleChange}
            className={inputClass}
          >
            {CONSULTATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition shadow-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 px-4 bg-[#0d9488] text-white text-sm font-medium rounded-xl hover:bg-[#0b7c72] active:scale-[0.98] disabled:opacity-50 transition shadow-sm"
        >
          {submitting ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </div>
  );
}
