import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  CheckCircle,
  Users,
  BarChart2,
  Star,
  Search,
  X,
} from "lucide-react";
import {
  getDoctorDashboard,
  getDoctorAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  getDoctorPatients,
  getDoctorAnalytics,
  getAvailability,
} from "../../api/doctorApi";
import StatCard from "../../components/ui/StatCard";
import ActivityFeed from "../../components/dashboard/ActivityFeed";
import AnalyticsStrip from "../../components/dashboard/AnalyticsStrip";
import SlotUtilisation from "../../components/dashboard/SlotUtilisation";
import AppointmentsTable from "../../components/dashboard/AppointmentsTable";
import MedicalRecordModal from "../../components/dashboard/MedicalRecordModal";
import PatientRecordsModal from "../../components/dashboard/PatientRecordsModal";
import PrescriptionModal from "../../components/dashboard/PrescriptionModal";
import AvailabilityCalendar from "../../components/dashboard/AvailabilityCalendar";
import ChatWidget from "../../components/dashboard/ChatWidget";
import { useDoctorContext } from "../../components/layout/DashboardLayout";
import { useToast } from "../../components/ui/Toast";
import { getInitials } from "../../utils/colors";

// ── Custom styled status dropdown ────────────────────────────────────────────
const STATUS_OPTS = [
  { value: "", label: "All Status", dot: "bg-gray-400" },
  { value: "pending", label: "Pending", dot: "bg-amber-400" },
  { value: "confirmed", label: "Confirmed", dot: "bg-blue-500" },
  { value: "completed", label: "Completed", dot: "bg-emerald-500" },
  { value: "cancelled", label: "Cancelled", dot: "bg-rose-500" },
];

function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const dropRef = useRef(null);
  const current = STATUS_OPTS.find((o) => o.value === value) || STATUS_OPTS[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      const clickedBtn = btnRef.current?.contains(e.target);
      const clickedDrop = dropRef.current?.contains(e.target);
      if (!clickedBtn && !clickedDrop) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  // Recalculate position on open
  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen((o) => !o);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-2 pl-3 pr-4 h-10 rounded-xl glass-input border border-gray-200 dark:border-white/10
          text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[136px] hover:border-teal-400/40 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${current.dot}`} />
        <span className="flex-1 text-left">{current.label}</span>
        <svg
          className={`h-3.5 w-3.5 opacity-50 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open &&
        createPortal(
          <div
            ref={dropRef}
            style={{
              position: "fixed",
              top: dropPos.top,
              left: dropPos.left,
              zIndex: 99999,
            }}
            className="w-44 rounded-2xl glass-card shadow-xl border border-gray-200 dark:border-white/10 py-1 animate-fade-in"
          >
            {STATUS_OPTS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors ${
                  value === opt.value
                    ? "text-teal-600 dark:text-teal-400 bg-teal-500/10"
                    : "text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                {opt.label}
                {value === opt.value && (
                  <span className="ml-auto text-teal-500">✓</span>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

// ── Helpers shared by custom calendar pickers ──────────────────────────────
const CAL_MONTHS = [
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
const CAL_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
function calDaysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}
function calFirstDay(y, m) {
  return new Date(y, m, 1).getDay();
}
function calStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ── Appointments date-range picker — custom calendar dropdown ─────────────────
function ApptDateRangePicker({ dateFrom, dateTo, onChange }) {
  const today = new Date();
  const todayStr = calStr(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const initDate = dateFrom ? new Date(dateFrom + "T00:00:00") : today;

  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(initDate.getFullYear());
  const [month, setMonth] = useState(initDate.getMonth());
  // "start" = next click sets dateFrom; "end" = next click sets dateTo
  const [picking, setPicking] = useState("start");
  const [hoverDate, setHoverDate] = useState(null);
  const triggerRef = useRef(null);
  const dropRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Sync month view when dateFrom changes externally
  useEffect(() => {
    if (dateFrom) {
      const d = new Date(dateFrom + "T00:00:00");
      setYear(d.getFullYear());
      setMonth(d.getMonth());
    }
  }, [dateFrom]);

  // Position dropdown under trigger
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
    });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (
        dropRef.current &&
        !dropRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
        if (!dateTo) setPicking("start"); // abandoned mid-selection → reset
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, dateTo]);

  const openPicker = () => {
    if (dateFrom && !dateTo) setPicking("end");
    else setPicking("start");
    setOpen(true);
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const handleDayClick = (dateStr) => {
    if (picking === "start") {
      onChange({ dateFrom: dateStr, dateTo: "" });
      setPicking("end");
    } else {
      if (dateStr >= dateFrom) {
        onChange({ dateFrom, dateTo: dateStr });
        setOpen(false);
        setPicking("start");
      } else {
        // Clicked before start → reset start date
        onChange({ dateFrom: dateStr, dateTo: "" });
        setPicking("end");
      }
    }
  };

  const getDayClass = (dateStr) => {
    const isToday = dateStr === todayStr;

    if (dateFrom && dateTo) {
      if (dateStr === dateFrom && dateStr === dateTo)
        return "range-start range-end";
      if (dateStr === dateFrom) return "range-start";
      if (dateStr === dateTo) return "range-end";
      if (dateStr > dateFrom && dateStr < dateTo) return "in-range";
    } else if (dateFrom && !dateTo && picking === "end" && hoverDate) {
      const lo = dateFrom <= hoverDate ? dateFrom : hoverDate;
      const hi = dateFrom <= hoverDate ? hoverDate : dateFrom;
      if (dateStr === lo && lo === hi) return "range-start range-end";
      if (dateStr === lo) return "range-start";
      if (dateStr === hi) return "range-end";
      if (dateStr > lo && dateStr < hi) return "in-range";
    } else if (dateStr === dateFrom) {
      return "range-start range-end";
    }

    return isToday ? "today" : "text-gray-700 dark:text-gray-300";
  };

  const getLabel = () => {
    const fmt = (s) =>
      new Date(s + "T00:00:00").toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    if (dateFrom && dateTo) return `${fmt(dateFrom)} – ${fmt(dateTo)}`;
    if (dateFrom) return `From ${fmt(dateFrom)}`;
    return "Select date range";
  };

  const days = calDaysInMonth(year, month);
  const firstDay = calFirstDay(year, month);

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={openPicker}
        className={`flex items-center gap-2 pl-3 pr-4 h-10 rounded-xl glass-input border text-sm font-medium min-w-[220px]
          transition-colors ${
            open
              ? "border-teal-500 ring-2 ring-teal-500/30 text-gray-800 dark:text-gray-100"
              : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-teal-400/40"
          }`}
      >
        <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
        <span className={dateFrom ? "text-gray-700 dark:text-gray-200" : ""}>
          {getLabel()}
        </span>
      </button>

      {/* Dropdown via portal — escapes stacking contexts */}
      {open &&
        createPortal(
          <div
            ref={dropRef}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              zIndex: 9999,
            }}
            className="availability-calendar w-72 glass-card rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-4"
          >
            {/* Selection hint */}
            <div className="text-center text-[11px] font-semibold text-teal-600 dark:text-teal-400 mb-2 tracking-wide uppercase">
              {picking === "start" ? "Pick start date" : "Pick end date"}
            </div>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
              >
                ◀
              </button>
              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                {CAL_MONTHS[month]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
              >
                ▶
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {CAL_DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {[...Array(firstDay)].map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {[...Array(days)].map((_, i) => {
                const day = i + 1;
                const dateStr = calStr(year, month, day);
                const cls = getDayClass(dateStr);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayClick(dateStr)}
                    onMouseEnter={() =>
                      picking === "end" && setHoverDate(dateStr)
                    }
                    onMouseLeave={() => picking === "end" && setHoverDate(null)}
                    className={`cal-day text-sm ${cls}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  onChange({ dateFrom: "", dateTo: "" });
                  setOpen(false);
                  setPicking("start");
                }}
                className="text-xs text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = calStr(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate(),
                  );
                  onChange({ dateFrom: t, dateTo: t });
                  setYear(today.getFullYear());
                  setMonth(today.getMonth());
                  setOpen(false);
                  setPicking("start");
                }}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
              >
                Today
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Search overlay ────────────────────────────────────────────────────────────
function PatientSearchOverlay({ onClose, onSelectPatient }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await getDoctorPatients({ search: query, limit: 6 });
        setResults(data.patients || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
      <div className="w-full max-w-lg glass-card rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-white/10">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient name or ID…"
            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-1">
          {loading && (
            <p className="text-center text-sm text-gray-400 py-6">Searching…</p>
          )}
          {!loading && query && results.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">
              No patients found for "{query}"
            </p>
          )}
          {!loading && !query && (
            <p className="text-center text-sm text-gray-400 py-6">
              Start typing to search patients
            </p>
          )}
          {results.map((p) => (
            <button
              key={p._id}
              onClick={() => {
                onSelectPatient?.(p);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(p.fullName)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {p.fullName}
                </p>
                <p className="text-xs text-gray-400">
                  {p.patientId || "—"} · {p.appointmentCount ?? 0} appts
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage({
  searchOpen,
  onSearchClose,
  quickAction,
  onQuickActionHandled,
}) {
  const { doctor, section, setSection } = useDoctorContext();
  const { toast } = useToast();

  // ── Data state ────────────────────────────────────────────────────────────
  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [todayAppts, setTodayAppts] = useState([]);
  const [todayLoading, setTodayLoading] = useState(true);
  const [slotsData, setSlotsData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [allAppts, setAllAppts] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptFilter, setApptFilter] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [apptPagination, setApptPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientPagination, setPatientPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [chatAppt, setChatAppt] = useState(null);
  const [recordModal, setRecordModal] = useState(null);
  const [prescripModal, setPrescripModal] = useState(null);
  const [patientRecordsModal, setPatientRecordsModal] = useState(null); // { patientId, patientName }
  // searchOpen / onSearchClose come from DashboardLayout via cloneElement

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    getDoctorDashboard()
      .then((r) => setDashData(r.data))
      .catch(console.error)
      .finally(() => setDashLoading(false));

    const today = new Date().toISOString().split("T")[0];
    getDoctorAppointments({ date: today, limit: 10 })
      .then((r) => setTodayAppts(r.data.appointments || []))
      .catch(console.error)
      .finally(() => setTodayLoading(false));

    getAvailability()
      .then((r) => buildSlotUtilisation(r.data.slots || []))
      .catch(console.error);
  }, []);

  // Handle quick-action clicks from the Sidebar
  // These switch section to Appointments and indicate which action modal to open.
  // We store a hint in a ref to be picked up on next Appointments render.
  useEffect(() => {
    if (!quickAction) return;
    setSection("Appointments");
    // Reset immediately — the sidebar already set section; user can click the row buttons
    onQuickActionHandled?.();
  }, [quickAction, setSection, onQuickActionHandled]);

  const buildSlotUtilisation = (slots) => {
    const colorKeys = [
      "teal",
      "cyan",
      "violet",
      "rose",
      "amber",
      "emerald",
      "blue",
    ];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const byDay = dayNames
      .map((label, idx) => {
        const daySlots = slots.filter(
          (s) => new Date(s.date + "T00:00:00").getDay() === idx,
        );
        const total = daySlots.length;
        const booked = daySlots.filter((s) => s.isBooked).length;
        return {
          label,
          pct: total > 0 ? Math.round((booked / total) * 100) : 0,
          colorKey: colorKeys[idx % colorKeys.length],
        };
      })
      .filter((d) =>
        slots.some(
          (s) =>
            new Date(s.date + "T00:00:00").getDay() ===
            dayNames.indexOf(d.label),
        ),
      );
    const total = slots.length;
    const booked = slots.filter((s) => s.isBooked).length;
    setSlotsData({
      data: byDay,
      summary: { total, booked, free: total - booked },
    });
  };

  // ── Appointments ─────────────────────────────────────────────────────────
  const loadAppointments = useCallback(
    async (page = 1) => {
      setApptLoading(true);
      try {
        const { data } = await getDoctorAppointments({
          page,
          limit: 10,
          ...apptFilter,
        });
        setAllAppts(data.appointments || []);
        setApptPagination(data.pagination || { page, pages: 1, total: 0 });
      } catch (e) {
        console.error(e);
      } finally {
        setApptLoading(false);
      }
    },
    [apptFilter],
  );

  useEffect(() => {
    if (section === "Appointments") loadAppointments(1);
  }, [section, loadAppointments]);

  // ── Patients ─────────────────────────────────────────────────────────────
  const loadPatients = useCallback(
    async (page = 1) => {
      setPatientLoading(true);
      try {
        const { data } = await getDoctorPatients({
          page,
          limit: 10,
          search: patientSearch,
        });
        setPatients(data.patients || []);
        setPatientPagination(data.pagination || { page, pages: 1, total: 0 });
      } catch (e) {
        console.error(e);
      } finally {
        setPatientLoading(false);
      }
    },
    [patientSearch],
  );

  useEffect(() => {
    if (section === "My Patients") loadPatients(1);
  }, [section, loadPatients]);

  // ── Analytics — fetch from dashboard endpoint (same data, reliable) ───────
  useEffect(() => {
    if (section === "Analytics") {
      setAnalyticsLoading(true);
      // Try dedicated analytics endpoint first; fall back to dashData
      getDoctorAnalytics()
        .then((r) => {
          // Backend /doctor/analytics may return stats inside r.data directly
          const payload = r.data;
          // Normalise: expects { stats: { totalAppointments, completedAppointments, totalPatients }, doctor: { rating } }
          if (payload?.stats) {
            setAnalyticsData(payload);
          } else {
            // Flatten if API returns stats at root level
            setAnalyticsData({ stats: payload, doctor: payload?.doctor });
          }
        })
        .catch(() => {
          // Fall back to already-loaded dashboard data
          if (dashData) setAnalyticsData(dashData);
        })
        .finally(() => setAnalyticsLoading(false));
    }
  }, [section, dashData]);

  // ── Status update ─────────────────────────────────────────────────────────
  const handleStatusChange = async (appointmentId, status) => {
    try {
      await updateAppointmentStatus(appointmentId, { status });
      const labels = {
        confirmed: "Appointment confirmed",
        cancelled: "Appointment cancelled",
        completed: "Appointment completed",
      };
      toast(
        labels[status] || "Status updated",
        status === "cancelled" ? "warning" : "success",
      );
      const today = new Date().toISOString().split("T")[0];
      getDoctorAppointments({ date: today, limit: 10 }).then((r) =>
        setTodayAppts(r.data.appointments || []),
      );
      if (section === "Appointments") loadAppointments(apptPagination.page);
      getDoctorDashboard()
        .then((r) => setDashData(r.data))
        .catch(() => {});
    } catch (e) {
      toast("Failed to update status", "error");
      console.error(e);
    }
  };

  // ── Delete appointment ─────────────────────────────────────────────
  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm("Delete this appointment? This cannot be undone."))
      return;
    try {
      await deleteAppointment(appointmentId);
      toast("Appointment deleted", "success");
      // Refresh both today's list and the full appointments list
      const today = new Date().toISOString().split("T")[0];
      getDoctorAppointments({ date: today, limit: 10 }).then((r) =>
        setTodayAppts(r.data.appointments || []),
      );
      if (section === "Appointments") loadAppointments(apptPagination.page);
      getDoctorDashboard()
        .then((r) => setDashData(r.data))
        .catch(() => {});
    } catch (e) {
      toast(
        e?.response?.data?.message || "Failed to delete appointment",
        "error",
      );
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const buildActivities = () =>
    todayAppts.slice(0, 5).map((a) => ({
      type:
        a.status === "completed"
          ? "completed"
          : a.status === "cancelled"
            ? "alert"
            : "appointment",
      message: `Appointment with ${a.patientProfile?.fullName || "patient"} — ${a.status}`,
      time: `${new Date(a.date).toLocaleDateString("en-GB")} · ${a.time || ""}`,
    }));

  const buildAnalyticsStrip = (src) => {
    const stats = src?.stats || {};
    const docInfo = src?.doctor || {};
    const {
      totalAppointments = 0,
      completedAppointments = 0,
      totalPatients = 0,
      pendingAppointments = 0,
    } = stats;
    const compRate =
      totalAppointments > 0
        ? Math.round((completedAppointments / totalAppointments) * 100)
        : 0;
    const rating = Number(docInfo?.rating || doctor?.rating || 0);
    return [
      {
        label: "Completion Rate",
        value: `${compRate}%`,
        pct: compRate,
        colorKey: "teal",
      },
      {
        label: "Avg Rating",
        value: rating ? `${rating.toFixed(1)}/5` : "—",
        pct: (rating / 5) * 100,
        colorKey: "amber",
      },
      {
        label: "Patients",
        value: totalPatients,
        pct: Math.min((totalPatients / 50) * 100, 100),
        colorKey: "violet",
      },
      {
        label: "Pending",
        value: pendingAppointments,
        pct: Math.min((pendingAppointments / 10) * 100, 100),
        colorKey: "rose",
      },
    ];
  };

  // ════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* Patient search overlay — triggered from Topbar search button */}
      {searchOpen && (
        <PatientSearchOverlay
          onClose={onSearchClose}
          onSelectPatient={(p) => {
            setSection("My Patients");
          }}
        />
      )}

      <div className="space-y-6 animate-fade-in">
        {/* ── DASHBOARD ─────────────────────────────────────────────────────── */}
        {section === "Dashboard" && (
          <div className="space-y-6">
            {/* Welcome banner */}
            {doctor && (
              <div className="welcome-banner rounded-2xl px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {doctor.avatarUrl ? (
                    <img
                      src={doctor.avatarUrl}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-xl">
                      {getInitials(doctor.fullName)}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">
                      Dr. {doctor.fullName}
                    </p>
                    <p className="text-white/70 text-sm">
                      {doctor.specialization}
                    </p>
                    {doctor.doctorId && (
                      <p className="text-white/50 text-xs mt-0.5">
                        {doctor.doctorId}
                      </p>
                    )}
                  </div>
                </div>
                {Number(doctor.rating) > 0 && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 text-white font-bold text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                    {Number(doctor.rating).toFixed(1)} / 5
                  </div>
                )}
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
              <StatCard
                icon={Calendar}
                label="Today's Appointments"
                value={dashData?.stats?.todayAppointments}
                colorKey="teal"
                loading={dashLoading}
              />
              <StatCard
                icon={Clock}
                label="Pending"
                value={dashData?.stats?.pendingAppointments}
                colorKey="amber"
                loading={dashLoading}
              />
              <StatCard
                icon={CheckCircle}
                label="Completed"
                value={dashData?.stats?.completedAppointments}
                colorKey="emerald"
                loading={dashLoading}
              />
              <StatCard
                icon={Users}
                label="Total Patients"
                value={dashData?.stats?.totalPatients}
                colorKey="violet"
                loading={dashLoading}
              />
            </div>

            {/* Today's appointments table */}
            <AppointmentsTable
              appointments={todayAppts}
              loading={todayLoading}
              onConfirm={(id) => handleStatusChange(id, "confirmed")}
              onCancel={(id) => handleStatusChange(id, "cancelled")}
              onDelete={handleDeleteAppointment}
              onAddRecord={(a) =>
                setRecordModal({
                  patientId: a.patientProfile?._id,
                  appointmentId: a._id,
                })
              }
              onPrescription={(a) =>
                setPrescripModal({
                  patientId: a.patientProfile?._id,
                  appointmentId: a._id,
                  patientName: a.patientProfile?.fullName,
                })
              }
              onChat={(a) => setChatAppt(a)}
              onViewRecords={(a) =>
                setPatientRecordsModal({
                  patientId: a.patientProfile?._id,
                  patientName: a.patientProfile?.fullName,
                })
              }
              onViewAll={() => setSection("Appointments")}
            />

            {/* Activity + Slot Utilisation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityFeed
                activities={buildActivities()}
                loading={todayLoading}
                onSeeAll={() => setSection("Appointments")}
              />
              <SlotUtilisation
                data={slotsData?.data || []}
                summary={slotsData?.summary || null}
              />
            </div>

            {/* Performance Overview strip */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Performance Overview
                </h2>
                <button
                  onClick={() => setSection("Analytics")}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
                >
                  Full Analytics →
                </button>
              </div>
              <AnalyticsStrip
                data={buildAnalyticsStrip(dashData)}
                loading={dashLoading}
              />
            </div>
          </div>
        )}

        {/* ── APPOINTMENTS ────────────────────────────────────────────────── */}
        {section === "Appointments" && (
          <div className="space-y-4">
            {/* Filter bar card — z-[100] ensures the StatusDropdown floats above the
                appointments table below (which uses glass-card with z-index:1).
                overflow:visible is critical so the dropdown can escape the card boundary. */}
            <div
              className="glass-card rounded-2xl p-4"
              style={{
                zIndex: 100,
                position: "relative",
                overflow: "visible",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Appointments
                </h2>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {apptPagination.total ?? 0} total
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {/* Custom status dropdown */}
                <StatusDropdown
                  value={apptFilter.status}
                  onChange={(v) => setApptFilter((p) => ({ ...p, status: v }))}
                />

                {/* Date range picker — same visual style as Availability Calendar */}
                <ApptDateRangePicker
                  dateFrom={apptFilter.dateFrom}
                  dateTo={apptFilter.dateTo}
                  onChange={({ dateFrom, dateTo }) =>
                    setApptFilter((p) => ({ ...p, dateFrom, dateTo }))
                  }
                />

                {/* Patient search input */}
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search patient…"
                    value={apptFilter.search}
                    onChange={(e) =>
                      setApptFilter((p) => ({ ...p, search: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && loadAppointments(1)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl text-sm border border-gray-200 dark:border-white/10
                      glass-input text-gray-700 dark:text-gray-300
                      focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <button
                  onClick={() => loadAppointments(1)}
                  className="h-10 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-md shadow-teal-600/20"
                >
                  Search
                </button>
                <button
                  onClick={() => {
                    setApptFilter({
                      status: "",
                      dateFrom: "",
                      dateTo: "",
                      search: "",
                    });
                  }}
                  className="h-10 px-4 rounded-xl text-sm border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <AppointmentsTable
              appointments={allAppts}
              loading={apptLoading}
              onConfirm={(id) => handleStatusChange(id, "confirmed")}
              onCancel={(id) => handleStatusChange(id, "cancelled")}
              onDelete={handleDeleteAppointment}
              onAddRecord={(a) =>
                setRecordModal({
                  patientId: a.patientProfile?._id,
                  appointmentId: a._id,
                })
              }
              onPrescription={(a) =>
                setPrescripModal({
                  patientId: a.patientProfile?._id,
                  appointmentId: a._id,
                  patientName: a.patientProfile?.fullName,
                })
              }
              onChat={(a) => setChatAppt(a)}
              onViewRecords={(a) =>
                setPatientRecordsModal({
                  patientId: a.patientProfile?._id,
                  patientName: a.patientProfile?.fullName,
                })
              }
            />

            {apptPagination.pages > 1 && (
              <div className="flex items-center justify-between px-2 pt-2">
                <p className="text-xs text-gray-500">
                  Total: {apptPagination.total}
                </p>
                <div className="flex gap-1 items-center">
                  <button
                    disabled={apptPagination.page <= 1}
                    onClick={() => loadAppointments(apptPagination.page - 1)}
                    className="px-2.5 py-1 rounded-lg text-xs glass-btn text-gray-600 dark:text-gray-300 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <span className="px-3 py-1 text-xs text-gray-500">
                    {apptPagination.page} / {apptPagination.pages}
                  </span>
                  <button
                    disabled={apptPagination.page >= apptPagination.pages}
                    onClick={() => loadAppointments(apptPagination.page + 1)}
                    className="px-2.5 py-1 rounded-lg text-xs glass-btn text-gray-600 dark:text-gray-300 disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MY PATIENTS ──────────────────────────────────────────────────── */}
        {section === "My Patients" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search patient name or ID…"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadPatients(1)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl text-sm border border-gray-200 dark:border-white/10
                    bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                    focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button
                onClick={() => loadPatients(1)}
                className="h-10 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
              >
                Search
              </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              {patientLoading ? (
                <div className="p-8 flex justify-center">
                  <span className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : patients.length === 0 ? (
                <p className="p-8 text-center text-sm text-gray-400">
                  No patients found.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 text-left">
                      {["Patient", "ID", "Appointments", "Last Visit"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-gray-500"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr
                        key={p._id}
                        className="border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {p.fullName || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                          {p.patientId || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {p.appointmentCount ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                          {p.lastVisit
                            ? new Date(p.lastVisit).toLocaleDateString("en-GB")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {patientPagination.pages > 1 && (
              <div className="flex items-center justify-between px-2">
                <p className="text-xs text-gray-500">
                  Total: {patientPagination.total}
                </p>
                <div className="flex gap-1 items-center">
                  <button
                    disabled={patientPagination.page <= 1}
                    onClick={() => loadPatients(patientPagination.page - 1)}
                    className="px-2.5 py-1 rounded-lg text-xs glass-btn text-gray-600 dark:text-gray-300 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <span className="px-3 py-1 text-xs text-gray-500">
                    {patientPagination.page} / {patientPagination.pages}
                  </span>
                  <button
                    disabled={patientPagination.page >= patientPagination.pages}
                    onClick={() => loadPatients(patientPagination.page + 1)}
                    className="px-2.5 py-1 rounded-lg text-xs glass-btn text-gray-600 dark:text-gray-300 disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AVAILABILITY ────────────────────────────────────────────────── */}
        {section === "Availability" && <AvailabilityCalendar />}

        {/* ── ANALYTICS ───────────────────────────────────────────────────── */}
        {section === "Analytics" && (
          <div className="space-y-6">
            {/* Stat cards — use analyticsData if loaded, fall back to dashData */}
            {(() => {
              const src = analyticsData || dashData;
              const stats = src?.stats || {};
              const docInfo = src?.doctor || {};
              const rating = Number(docInfo?.rating || doctor?.rating || 0);
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
                  <StatCard
                    icon={Calendar}
                    label="Total Appointments"
                    value={stats.totalAppointments}
                    colorKey="teal"
                    loading={analyticsLoading && !dashData}
                  />
                  <StatCard
                    icon={CheckCircle}
                    label="Completed"
                    value={stats.completedAppointments}
                    colorKey="emerald"
                    loading={analyticsLoading && !dashData}
                  />
                  <StatCard
                    icon={Users}
                    label="Total Patients"
                    value={stats.totalPatients}
                    colorKey="violet"
                    loading={analyticsLoading && !dashData}
                  />
                  <StatCard
                    icon={BarChart2}
                    label="Avg Rating"
                    value={
                      rating > 0 ? `${rating.toFixed(1)} / 5` : "No ratings yet"
                    }
                    colorKey="amber"
                    loading={analyticsLoading && !dashData}
                  />
                </div>
              );
            })()}

            <AnalyticsStrip
              data={buildAnalyticsStrip(analyticsData || dashData)}
              loading={analyticsLoading && !dashData}
            />
          </div>
        )}

        {/* ── MODALS ──────────────────────────────────────────────────────── */}
        {recordModal && (
          <MedicalRecordModal
            patientId={recordModal.patientId}
            appointmentId={recordModal.appointmentId}
            onClose={() => setRecordModal(null)}
            onSaved={() => {
              setRecordModal(null);
              toast("Medical record saved successfully.", "success");
            }}
          />
        )}
        {prescripModal && (
          <PrescriptionModal
            patientId={prescripModal.patientId}
            appointmentId={prescripModal.appointmentId}
            patientName={prescripModal.patientName}
            onClose={() => setPrescripModal(null)}
            onSuccess={() =>
              toast("Prescription generated successfully.", "success")
            }
          />
        )}
        {chatAppt && (
          <ChatWidget
            appointment={chatAppt}
            onClose={() => setChatAppt(null)}
          />
        )}
        {patientRecordsModal && (
          <PatientRecordsModal
            patientId={patientRecordsModal.patientId}
            patientName={patientRecordsModal.patientName}
            onClose={() => setPatientRecordsModal(null)}
          />
        )}
      </div>
    </>
  );
}
