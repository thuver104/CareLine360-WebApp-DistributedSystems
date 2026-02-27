import { useState, useEffect } from "react";
import {
  getAvailability,
  addAvailabilitySlots,
  deleteAvailabilitySlot,
  updateAvailabilitySlot,
} from "../../api/doctorApi";
import { useToast } from "../ui/Toast";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}
function getFirstDayOfMonth(y, m) {
  return new Date(y, m, 1).getDay();
}
function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function AvailabilityCalendar() {
  const { toast } = useToast();
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({
    startTime: "09:00",
    endTime: "09:30",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingSlot, setEditingSlot] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getAvailability()
      .then((r) => setSlots(r.data.slots || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const slotsForDate = (dateStr) => slots.filter((s) => s.date === dateStr);

  // ── Add ─────────────────────────────────────────────────────────────────────
  const handleAddSlot = async () => {
    if (!selectedDate) return;
    if (!addForm.startTime || !addForm.endTime)
      return setError("Start and end time are required.");
    if (addForm.startTime >= addForm.endTime)
      return setError("End time must be after start time.");

    // ✅ Duplicate check — same date + same startTime
    const existing = slotsForDate(selectedDate);
    const duplicate = existing.find((s) => s.startTime === addForm.startTime);
    if (duplicate)
      return setError(
        `A slot starting at ${addForm.startTime} already exists on this date.`,
      );

    // ✅ Overlap check — new slot overlaps any existing slot
    const overlap = existing.find((s) => {
      const newStart = addForm.startTime,
        newEnd = addForm.endTime;
      return newStart < s.endTime && newEnd > s.startTime;
    });
    if (overlap)
      return setError(
        `This slot overlaps with ${overlap.startTime}–${overlap.endTime}. Please choose a different time.`,
      );

    setError("");
    setSaving(true);
    try {
      const r = await addAvailabilitySlots([
        {
          date: selectedDate,
          startTime: addForm.startTime,
          endTime: addForm.endTime,
        },
      ]);
      setSlots(r.data.slots || []);
      toast("Slot added successfully.", "success");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to add slot");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteSlot = async (slotId) => {
    try {
      const r = await deleteAvailabilitySlot(slotId);
      setSlots(r.data.slots || slots.filter((s) => s._id !== slotId));
      toast("Slot removed.", "info");
    } catch (e) {
      setError(e?.response?.data?.message || "Cannot delete slot");
    }
  };

  // ── Update ──────────────────────────────────────────────────────────────────
  const handleUpdateSlot = async () => {
    if (!editingSlot) return;
    const { slotId, startTime, endTime } = editingSlot;
    if (!startTime || !endTime) return setError("Start and end time required.");
    if (startTime >= endTime)
      return setError("End time must be after start time.");

    // Overlap check excluding current slot
    const existing = slotsForDate(selectedDate).filter((s) => s._id !== slotId);
    const overlap = existing.find(
      (s) => startTime < s.endTime && endTime > s.startTime,
    );
    if (overlap)
      return setError(
        `Updated time overlaps with ${overlap.startTime}–${overlap.endTime}.`,
      );

    setError("");
    setUpdating(true);
    try {
      const r = await updateAvailabilitySlot(slotId, { startTime, endTime });
      setSlots(r.data.slots || []);
      setEditingSlot(null);
      toast("Slot updated successfully.", "success");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update slot");
    } finally {
      setUpdating(false);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 availability-calendar">
      {/* ── Calendar ──────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6">
        {/* Month Nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
          >
            ◀
          </button>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {MONTHS[viewMonth]} {viewYear}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
          >
            ▶
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {[...Array(firstDay)].map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const dateStr = toDateStr(viewYear, viewMonth, day);
            const daySlots = slotsForDate(dateStr);
            const isToday =
              dateStr ===
              toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
            const isSelected = dateStr === selectedDate;
            const isPast =
              new Date(dateStr) <
              new Date(
                toDateStr(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate(),
                ),
              );
            const hasBooked = daySlots.some((s) => s.isBooked);

            return (
              <button
                key={day}
                disabled={isPast}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setEditingSlot(null);
                  setError("");
                }}
                className={`cal-day ${
                  isSelected
                    ? "selected"
                    : isToday
                      ? "today"
                      : isPast
                        ? "past"
                        : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {day}
                {daySlots.length > 0 && (
                  <span
                    className={`cal-dot ${
                      isSelected
                        ? "bg-white"
                        : hasBooked
                          ? "bg-amber-500"
                          : "bg-teal-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Booked
          </span>
        </div>
      </div>

      {/* ── Slot Manager ──────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 flex flex-col min-h-[360px]">
        {!selectedDate ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400 dark:text-gray-500 text-sm gap-2">
            <span className="text-3xl">📅</span>
            Select a date on the calendar to manage slots
          </div>
        ) : (
          <div className="space-y-4 flex-1 flex flex-col">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                "en-GB",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                },
              )}
            </h3>

            {/* Error */}
            {error && (
              <p className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
                ⚠ {error}
              </p>
            )}

            {/* Add slot form */}
            <div className="bg-teal-500/10 dark:bg-teal-500/10 border border-teal-400/20 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                Add New Slot
              </p>
              <div className="flex gap-3">
                {[
                  ["Start", "startTime"],
                  ["End", "endTime"],
                ].map(([lbl, key]) => (
                  <div key={key} className="flex-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                      {lbl}
                    </label>
                    <input
                      type="time"
                      value={addForm[key]}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, [key]: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600
                        bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm
                        focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors
                        [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddSlot}
                disabled={saving}
                className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-md shadow-teal-500/20"
              >
                {saving && (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {saving ? "Adding…" : "+ Add Slot"}
              </button>
            </div>

            {/* Existing slots */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {loading ? (
                <p className="text-gray-400 text-sm">Loading…</p>
              ) : slotsForDate(selectedDate).length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">
                  No slots for this date. Add one above.
                </p>
              ) : (
                slotsForDate(selectedDate).map((slot) => (
                  <div
                    key={slot._id}
                    className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
                  >
                    {/* Slot row */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white/60 dark:bg-white/5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${slot.isBooked ? "bg-amber-500" : "bg-emerald-500"}`}
                        />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        {slot.isBooked && (
                          <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                            Booked
                          </span>
                        )}
                      </div>

                      {!slot.isBooked && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              editingSlot?.slotId === slot._id
                                ? setEditingSlot(null)
                                : (setEditingSlot({
                                    slotId: slot._id,
                                    startTime: slot.startTime,
                                    endTime: slot.endTime,
                                  }),
                                  setError(""))
                            }
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors font-medium ${
                              editingSlot?.slotId === slot._id
                                ? "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                                : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                            }`}
                          >
                            {editingSlot?.slotId === slot._id
                              ? "Cancel"
                              : "✏ Edit"}
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot._id)}
                            className="text-xs px-2.5 py-1 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors font-medium"
                          >
                            🗑 Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Inline edit panel */}
                    {editingSlot?.slotId === slot._id && (
                      <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900/30 space-y-3">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                          Edit Time
                        </p>
                        <div className="flex gap-3">
                          {[
                            ["Start", "startTime"],
                            ["End", "endTime"],
                          ].map(([lbl, key]) => (
                            <div key={key} className="flex-1">
                              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                {lbl}
                              </label>
                              <input
                                type="time"
                                value={editingSlot[key]}
                                onChange={(e) =>
                                  setEditingSlot((p) => ({
                                    ...p,
                                    [key]: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600
                                  bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm
                                  focus:outline-none focus:ring-2 focus:ring-blue-500
                                  [color-scheme:light] dark:[color-scheme:dark]"
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={handleUpdateSlot}
                          disabled={updating}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          {updating && (
                            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          )}
                          {updating ? "Saving…" : "Save Changes"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
