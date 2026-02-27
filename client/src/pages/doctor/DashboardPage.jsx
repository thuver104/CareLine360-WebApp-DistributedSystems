import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckCircle,
  Users,
  BarChart2,
  Star,
  Search,
  X,
  MessageSquare,
  ClipboardList,
  Pill,
  CalendarDays,
  User,
  Activity,
  Mail,
  Phone,
  TrendingUp,
  TrendingDown,
  PieChart,
  Video,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  getDoctorDashboard,
  getDoctorAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  getDoctorPatients,
  getDoctorAnalytics,
  getAvailability,
  getDoctorMeetings,
  triggerMeetingReminder,
  sendTestEmail,
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
import AnalyticsDonutChart from "../../components/dashboard/AnalyticsDonutChart";
import AnalyticsBarChart from "../../components/dashboard/AnalyticsBarChart";
import { useDoctorContext } from "../../components/layout/DashboardLayout";
import { useToast } from "../../components/ui/Toast";
import { getInitials } from "../../utils/colors";

// ── Framer-motion animation presets ──────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88, y: 12 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const slideInLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

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
  const [patientSearch, setPatientSearch] = useState(""); // input value
  const [patientSearchQuery, setPatientSearchQuery] = useState(""); // committed query
  const [patientPage, setPatientPage] = useState(1);
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
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // appointmentId pending delete

  // ── Meetings ──────────────────────────────────────────────────────────────
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  // countdown: null | { apptId, count } where count is 3 → 2 → 1 → 0 (open tab)
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);
  // Per-card live timers: { [apptId]: secondsUntilStart }
  const [meetingTimers, setMeetingTimers] = useState({});
  // Locally-marked-complete meeting IDs for instant dimming before data refresh
  const [completedMeetingIds, setCompletedMeetingIds] = useState(new Set());
  // Email test / reminder trigger state
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
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

    // Compute current week (Mon – Sun) for slot utilisation cross-reference
    const now = new Date();
    const dow = now.getDay(); // 0=Sun, 1=Mon…
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const weekFrom = monday.toISOString().split("T")[0];
    const weekTo = sunday.toISOString().split("T")[0];

    Promise.all([
      getAvailability(),
      getDoctorAppointments({ dateFrom: weekFrom, dateTo: weekTo, limit: 100 }),
    ])
      .then(([slotsRes, apptRes]) => {
        buildSlotUtilisation(
          slotsRes.data.slots || [],
          apptRes.data.appointments || [],
          monday,
        );
      })
      .catch(console.error);
  }, []);

  // Handle quick-action clicks from the Sidebar
  useEffect(() => {
    if (!quickAction) return;
    setSection("Appointments");
    onQuickActionHandled?.();
  }, [quickAction, setSection, onQuickActionHandled]);

  const buildSlotUtilisation = (slots, weekAppts = [], monday = null) => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const base =
      monday ||
      (() => {
        const d = new Date(now);
        const dow = d.getDay();
        d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
        d.setHours(0, 0, 0, 0);
        return d;
      })();

    const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const days = DAY_NAMES.map((name, idx) => {
      const dayDate = new Date(base);
      dayDate.setDate(base.getDate() + idx);
      const dateStr = dayDate.toISOString().split("T")[0];

      // Slots on this day
      const daySlots = slots.filter((s) => s.date === dateStr);
      // Appointments on this day (cross-reference by date)
      const dayAppts = weekAppts.filter((a) => {
        const aDate = new Date(a.date).toISOString().split("T")[0];
        return aDate === dateStr;
      });

      const total = daySlots.length;
      // A slot is booked if isBooked=true OR there's an appointment at that start time
      const booked = daySlots.filter(
        (s) => s.isBooked || dayAppts.some((a) => a.time === s.startTime),
      ).length;
      // Extra appointments beyond mapped slots still count
      const appts = dayAppts.length;
      const effectiveBooked = Math.max(booked, total > 0 ? 0 : 0);
      const pct =
        total > 0 ? Math.round((booked / total) * 100) : appts > 0 ? 100 : 0;

      return {
        label: name,
        dateStr,
        total,
        booked: effectiveBooked,
        appts,
        pct,
        isToday: dateStr === todayStr,
      };
    });

    const totalSlots = slots.length;
    const totalBooked = slots.filter((s) => s.isBooked).length;
    const totalAppts = weekAppts.length;

    setSlotsData({
      data: days,
      summary: {
        totalSlots,
        totalBooked,
        totalFree: totalSlots - totalBooked,
        totalAppts,
      },
    });
  };

  // ── Appointments ─────────────────────────────────────────────────────────
  const loadAppointments = useCallback(
    async (page = 1) => {
      setApptLoading(true);
      try {
        const { data } = await getDoctorAppointments({
          page,
          limit: 5,
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

  // ── Meetings ─────────────────────────────────────────────────────────────
  const loadMeetings = useCallback(async () => {
    setMeetingsLoading(true);
    try {
      const { data } = await getDoctorMeetings();
      setMeetings(data.meetings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setMeetingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (section === "Meetings") loadMeetings();
  }, [section, loadMeetings]);

  // ── Per-card live countdown timer (ticks every second while on Meetings page)
  const getSecondsUntil = useCallback((appt) => {
    const d = new Date(appt.date);
    const [hh, mm] = (appt.time || "00:00").split(":").map(Number);
    const apptDT = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      hh,
      mm,
      0,
    );
    return Math.floor((apptDT.getTime() - Date.now()) / 1000);
  }, []);

  const formatSecondsUntil = (secs) => {
    if (secs <= 0) return null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n) => String(n).padStart(2, "0");
    if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
    if (m > 0) return `${pad(m)}m ${pad(s)}s`;
    return `${pad(s)}s`;
  };

  // Build initial timer map whenever meetings list changes
  useEffect(() => {
    if (!meetings.length) return;
    const next = {};
    meetings.forEach((a) => {
      next[a._id] = getSecondsUntil(a);
    });
    setMeetingTimers(next);
  }, [meetings, getSecondsUntil]);

  // Tick every second while viewing Meetings
  useEffect(() => {
    if (section !== "Meetings") return;
    const iv = setInterval(() => {
      setMeetingTimers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          next[id] = next[id] - 1;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [section]);

  // Countdown logic: triggers when countdown.count reaches 0
  useEffect(() => {
    if (!countdown) return;
    if (countdown.count <= 0) {
      // Open meeting in new tab
      const meetingUrl = `https://meet.jit.si/CareLine360-${countdown.apptId}`;
      window.open(meetingUrl, "_blank", "noopener,noreferrer");
      setCountdown(null);
      return;
    }
    const t = setTimeout(() => {
      setCountdown((prev) =>
        prev ? { ...prev, count: prev.count - 1 } : null,
      );
    }, 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Handle delete from Meetings page
  const handleDeleteMeeting = async (appointmentId) => {
    try {
      await deleteAppointment(appointmentId);
      toast("Meeting removed", "success");
      loadMeetings();
      getDoctorDashboard()
        .then((r) => setDashData(r.data))
        .catch(() => {});
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to remove meeting", "error");
    }
  };

  // Mark a meeting as completed (dims the card immediately, then syncs server)
  const handleMarkComplete = async (apptId) => {
    // Optimistic: dim the card immediately
    setCompletedMeetingIds((prev) => new Set(prev).add(apptId));
    try {
      await updateAppointmentStatus(apptId, { status: "completed" });
      toast("Meeting marked as completed", "success");
      loadMeetings();
      getDoctorDashboard()
        .then((r) => setDashData(r.data))
        .catch(() => {});
    } catch (e) {
      // Rollback optimistic update on error
      setCompletedMeetingIds((prev) => {
        const s = new Set(prev);
        s.delete(apptId);
        return s;
      });
      toast(e?.response?.data?.message || "Failed to mark complete", "error");
    }
  };

  // Start countdown for a given appointmentId
  const startCountdown = (apptId) => {
    if (countdownRef.current) clearTimeout(countdownRef.current);
    setCountdown({ apptId, count: 3 });
  };

  const handleTestEmail = async () => {
    setTestEmailLoading(true);
    try {
      const { data } = await sendTestEmail();
      toast(data.message || "Test email sent!", "success");
    } catch (e) {
      toast(e?.response?.data?.error || "Failed to send test email", "error");
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleTriggerReminder = async () => {
    setReminderLoading(true);
    try {
      const { data } = await triggerMeetingReminder();
      const count = data.todayVideoAppointments?.length ?? 0;
      toast(
        `Reminder check done – ${count} video appointment(s) found today. Check server console for details.`,
        count > 0 ? "success" : "info",
      );
    } catch (e) {
      toast(e?.response?.data?.error || "Reminder trigger failed", "error");
    } finally {
      setReminderLoading(false);
    }
  };

  // Check whether doctor can join (within 10 min before or after the appointment time)
  const canJoinMeeting = (appt) => {
    const d = new Date(appt.date);
    const [hh, mm] = (appt.time || "00:00").split(":").map(Number);
    const apptDT = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      hh,
      mm,
      0,
    );
    const now = new Date();
    const diffMs = apptDT.getTime() - now.getTime();
    // Allow from 10 min before up to 90 min after start
    return diffMs <= 10 * 60 * 1000 && diffMs >= -90 * 60 * 1000;
  };

  // ── Patients ─────────────────────────────────────────────────────────────
  // Declarative: runs whenever section, page, or committed search query changes.
  // patientSearch is only the input value (updated on every keystroke);
  // patientSearchQuery is committed when the user clicks Search or presses Enter.
  useEffect(() => {
    if (section !== "My Patients") return;
    let cancelled = false;
    setPatientLoading(true);
    getDoctorPatients({
      page: patientPage,
      limit: 6,
      search: patientSearchQuery,
    })
      .then(({ data }) => {
        if (cancelled) return;
        setPatients(data.patients || []);
        setPatientPagination(
          data.pagination || { page: patientPage, pages: 1, total: 0 },
        );
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setPatientLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section, patientPage, patientSearchQuery]);

  // Commit search: reset to page 1 and run the query
  const commitPatientSearch = useCallback(() => {
    setPatientSearchQuery(patientSearch);
    setPatientPage(1);
  }, [patientSearch]);

  // Keep a stable helper so JSX can trigger page changes
  const loadPatients = useCallback((page = 1) => setPatientPage(page), []);

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

      {/* ── Countdown Overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {countdown && (
          <motion.div
            key="countdown-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Pulsing ring */}
              <div className="relative flex items-center justify-center">
                <span className="absolute h-40 w-40 rounded-full bg-teal-500/20 animate-ping" />
                <div className="relative h-36 w-36 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-teal-500/50">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={countdown.count}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.3, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="text-6xl font-black text-white"
                    >
                      {countdown.count}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-bold">Joining Meeting…</p>
                <p className="text-white/60 text-sm mt-1">
                  Opening in a new tab
                </p>
              </div>
              <button
                onClick={() => setCountdown(null)}
                className="text-white/50 hover:text-white text-sm underline transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6 animate-fade-in">
        {/* ── DASHBOARD ─────────────────────────────────────────────────────── */}
        {section === "Dashboard" && (
          <div className="space-y-6">
            {/* Welcome banner */}
            {doctor && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="welcome-banner rounded-2xl px-6 py-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  {doctor.avatarUrl ? (
                    <motion.img
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15, duration: 0.4 }}
                      src={doctor.avatarUrl}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30"
                    />
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15, duration: 0.4 }}
                      className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-xl"
                    >
                      {getInitials(doctor.fullName)}
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
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
                  </motion.div>
                </div>
                {Number(doctor.rating) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.3,
                      duration: 0.4,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 text-white font-bold text-sm flex items-center gap-2"
                  >
                    <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                    {Number(doctor.rating).toFixed(1)} / 5
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Stat cards */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {[
                {
                  icon: Calendar,
                  label: "Today's Appointments",
                  value: dashData?.stats?.todayAppointments,
                  colorKey: "teal",
                },
                {
                  icon: Clock,
                  label: "Pending",
                  value: dashData?.stats?.pendingAppointments,
                  colorKey: "amber",
                },
                {
                  icon: CheckCircle,
                  label: "Completed",
                  value: dashData?.stats?.completedAppointments,
                  colorKey: "emerald",
                },
                {
                  icon: Users,
                  label: "Total Patients",
                  value: dashData?.stats?.totalPatients,
                  colorKey: "violet",
                },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  custom={i}
                  variants={scaleIn}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                >
                  <StatCard
                    icon={card.icon}
                    label={card.label}
                    value={card.value}
                    colorKey={card.colorKey}
                    loading={dashLoading}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Today's appointments table */}
            <motion.div
              variants={fadeUp}
              custom={2}
              initial="hidden"
              animate="visible"
              whileInView={{ opacity: 1 }}
            >
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
                onComplete={(id) => handleStatusChange(id, "completed")}
                onViewRecords={(a) =>
                  setPatientRecordsModal({
                    patientId: a.patientProfile?._id,
                    patientName: a.patientProfile?.fullName,
                  })
                }
                onViewAll={() => setSection("Appointments")}
              />
            </motion.div>

            {/* Activity + Slot Utilisation */}
            <motion.div
              variants={fadeUp}
              custom={2}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <ActivityFeed
                activities={buildActivities()}
                loading={todayLoading}
                onSeeAll={() => setSection("Appointments")}
              />
              <SlotUtilisation
                data={slotsData?.data || []}
                summary={slotsData?.summary || null}
                loading={!slotsData}
              />
            </motion.div>

            {/* Performance Overview strip */}
            <motion.div
              variants={fadeUp}
              custom={3}
              initial="hidden"
              animate="visible"
            >
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
            </motion.div>
          </div>
        )}
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
              onComplete={(id) => handleStatusChange(id, "completed")}
              onViewRecords={(a) =>
                setPatientRecordsModal({
                  patientId: a.patientProfile?._id,
                  patientName: a.patientProfile?.fullName,
                })
              }
              title="Appointments List"
              showDate
            />

            {/* Pagination */}
            {apptPagination.total > 0 && (
              <div className="flex items-center justify-between px-1 pt-3 border-t border-gray-200 dark:border-white/10 mt-2">
                {/* Showing X – Y of Z */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {(apptPagination.page - 1) * 5 + 1}
                  </span>
                  {" – "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {Math.min(apptPagination.page * 5, apptPagination.total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {apptPagination.total}
                  </span>{" "}
                  appointments
                </p>

                {/* Prev / page numbers / Next */}
                <div className="flex items-center gap-1">
                  {/* Prev */}
                  <button
                    disabled={apptPagination.page <= 1}
                    onClick={() => loadAppointments(apptPagination.page - 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                      glass-btn text-gray-600 dark:text-gray-300
                      disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ← Prev
                  </button>

                  {/* Page number pills */}
                  {Array.from({ length: apptPagination.pages }, (_, i) => i + 1)
                    .filter((p) => {
                      const cur = apptPagination.page;
                      const last = apptPagination.pages;
                      return p === 1 || p === last || Math.abs(p - cur) <= 1;
                    })
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === "…" ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1 text-xs text-gray-400 select-none"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => loadAppointments(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all
                            ${
                              p === apptPagination.page
                                ? "bg-teal-600 text-white shadow-sm"
                                : "glass-btn text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400"
                            }`}
                        >
                          {p}
                        </button>
                      ),
                    )}

                  {/* Next */}
                  <button
                    disabled={apptPagination.page >= apptPagination.pages}
                    onClick={() => loadAppointments(apptPagination.page + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                      glass-btn text-gray-600 dark:text-gray-300
                      disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MY PATIENTS ──────────────────────────────────────────────────── */}
        {section === "My Patients" && (
          <div className="space-y-5">
            {/* Header + search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  My Patients
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {patientPagination.total} patient
                  {patientPagination.total !== 1 ? "s" : ""} under your care
                </p>
              </div>
              <div className="flex gap-2 sm:ml-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search name or ID…"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && commitPatientSearch()
                    }
                    className="w-full h-10 pl-9 pr-3 rounded-xl text-sm glass-input
                      text-gray-700 dark:text-gray-300
                      focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  onClick={commitPatientSearch}
                  className="h-10 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shrink-0"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Cards grid */}
            {patientLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="glass-card rounded-2xl p-5 animate-pulse"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-white/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 rounded bg-gray-200 dark:bg-white/10 w-3/4" />
                        <div className="h-2.5 rounded bg-gray-200 dark:bg-white/10 w-1/2" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="h-12 rounded-xl bg-gray-200 dark:bg-white/10" />
                      <div className="h-12 rounded-xl bg-gray-200 dark:bg-white/10" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-9 rounded-xl bg-gray-200 dark:bg-white/10" />
                      <div className="flex-1 h-9 rounded-xl bg-gray-200 dark:bg-white/10" />
                      <div className="flex-1 h-9 rounded-xl bg-gray-200 dark:bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : patients.length === 0 ? (
              <div className="glass-card rounded-2xl p-16 flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-teal-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  No patients found.
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">
                  Patients appear here once they've booked an appointment with
                  you.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
                {patients.map((p, idx) => {
                  const name =
                    p.fullName || p.userId?.email || "Unknown Patient";
                  const initials =
                    name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0].toUpperCase())
                      .join("") || "?";
                  const email = p.userId?.email || "";
                  const phone = p.userId?.phone || "";
                  // Unique key — fall back to userId when no Patient profile exists
                  const cardKey =
                    p._id?.toString() ||
                    p.userId?._id?.toString() ||
                    String(idx);

                  return (
                    <div
                      key={cardKey}
                      className="glass-card rounded-2xl p-5 flex flex-col gap-4
                        hover:shadow-xl hover:shadow-teal-500/15 hover:-translate-y-1 hover:scale-[1.01]
                        transition-all duration-300 group patient-card"
                    >
                      {/* Avatar + Name */}
                      <div className="flex items-center gap-3">
                        {p.avatarUrl ? (
                          <img
                            src={p.avatarUrl}
                            alt={name}
                            className="h-14 w-14 rounded-full object-cover ring-2 ring-teal-400/30 shrink-0"
                          />
                        ) : (
                          <div
                            className="h-14 w-14 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600
                            flex items-center justify-center text-white text-lg font-bold
                            ring-2 ring-teal-400/20 shrink-0"
                          >
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
                            {name}
                          </p>
                          {p.patientId && (
                            <span
                              className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                              bg-teal-500/10 text-teal-600 dark:text-teal-400"
                            >
                              {p.patientId}
                            </span>
                          )}
                          {email && (
                            <p className="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
                              <Mail className="h-3 w-3 shrink-0" />
                              {email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2.5">
                          <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 mb-0.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                              Appointments
                            </span>
                          </div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {p.appointmentCount ?? 0}
                          </p>
                        </div>
                        <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2.5">
                          <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 mb-0.5">
                            <Activity className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                              Last Visit
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {p.lastVisit
                              ? new Date(p.lastVisit).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-white/10">
                        {/* Past Records */}
                        <button
                          onClick={() =>
                            setPatientRecordsModal({
                              patientId: p._id,
                              patientName: name,
                            })
                          }
                          disabled={!p._id}
                          title={
                            p._id
                              ? "Past Medical Records"
                              : "No patient profile"
                          }
                          className="group/btn flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                            text-[11px] font-semibold
                            bg-amber-500/10 text-amber-600 dark:text-amber-400
                            hover:bg-amber-500/25 hover:shadow-md hover:shadow-amber-500/20
                            transition-all duration-200 active:scale-95
                            disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ClipboardList className="h-4 w-4" />
                          <span>Records</span>
                        </button>

                        {/* Chat */}
                        <button
                          onClick={() => {
                            const apptId =
                              p.lastAppointmentId?._id || p.lastAppointmentId;
                            if (apptId) {
                              setChatAppt({
                                _id: apptId,
                                patientProfile: {
                                  fullName: name,
                                  avatarUrl: p.avatarUrl,
                                },
                                date: p.lastVisit,
                              });
                            }
                          }}
                          disabled={!p.lastAppointmentId}
                          title={
                            p.lastAppointmentId
                              ? "Chat with Patient"
                              : "No appointment found"
                          }
                          className="group/btn flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                            text-[11px] font-semibold
                            bg-blue-500/10 text-blue-600 dark:text-blue-400
                            hover:bg-blue-500/25 hover:shadow-md hover:shadow-blue-500/20
                            transition-all duration-200 active:scale-95
                            disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>Chat</span>
                        </button>

                        {/* Prescription */}
                        <button
                          onClick={() => {
                            const apptId =
                              p.lastAppointmentId?._id || p.lastAppointmentId;
                            if (apptId) {
                              setPrescripModal({
                                patientId: p._id,
                                appointmentId: apptId,
                                patientName: name,
                              });
                            }
                          }}
                          disabled={!p.lastAppointmentId || !p._id}
                          title={
                            !p._id
                              ? "No patient profile"
                              : p.lastAppointmentId
                                ? "Generate Prescription PDF"
                                : "No appointment found"
                          }
                          className="group/btn flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                            text-[11px] font-semibold
                            bg-violet-500/10 text-violet-600 dark:text-violet-400
                            hover:bg-violet-500/25 hover:shadow-md hover:shadow-violet-500/20
                            transition-all duration-200 active:scale-95
                            disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Pill className="h-4 w-4" />
                          <span>Prescription PDF</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {patientPagination.total > 0 && (
              <div className="flex items-center justify-between px-1 pt-3 border-t border-gray-200 dark:border-white/10">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {(patientPagination.page - 1) *
                      (patientPagination.limit || 6) +
                      1}
                  </span>
                  {" – "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {Math.min(
                      patientPagination.page * (patientPagination.limit || 6),
                      patientPagination.total,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {patientPagination.total}
                  </span>{" "}
                  patients
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={patientPagination.page <= 1}
                    onClick={() => setPatientPage((p) => p - 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                      glass-btn text-gray-600 dark:text-gray-300
                      disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ← Prev
                  </button>
                  {Array.from(
                    { length: patientPagination.pages },
                    (_, i) => i + 1,
                  )
                    .filter((p) => {
                      const cur = patientPagination.page;
                      const last = patientPagination.pages;
                      return p === 1 || p === last || Math.abs(p - cur) <= 1;
                    })
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === "…" ? (
                        <span
                          key={`el-${idx}`}
                          className="px-1 text-xs text-gray-400 select-none"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPatientPage(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all
                            ${
                              p === patientPagination.page
                                ? "bg-teal-600 text-white shadow-sm"
                                : "glass-btn text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400"
                            }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  <button
                    disabled={patientPagination.page >= patientPagination.pages}
                    onClick={() => setPatientPage((p) => p + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                      glass-btn text-gray-600 dark:text-gray-300
                      disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
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
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Analytics
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Your practice performance at a glance
              </p>
            </motion.div>

            {/* Stat cards — analyticsData now has correct stats.* from the fixed backend */}
            {(() => {
              const src = analyticsData || dashData;
              const stats = src?.stats || {};
              const docInfo = src?.doctor || {};
              const rating = Number(docInfo?.rating || doctor?.rating || 0);
              const isLoading = analyticsLoading && !dashData;
              const statCards = [
                {
                  icon: Calendar,
                  label: "Total Appointments",
                  value: stats.totalAppointments,
                  colorKey: "teal",
                },
                {
                  icon: CheckCircle,
                  label: "Completed",
                  value: stats.completedAppointments,
                  colorKey: "emerald",
                },
                {
                  icon: Users,
                  label: "Total Patients",
                  value: stats.totalPatients,
                  colorKey: "violet",
                },
                {
                  icon: Star,
                  label: "Avg Rating",
                  value:
                    rating > 0 ? `${rating.toFixed(1)} / 5` : "No ratings yet",
                  colorKey: "amber",
                },
              ];
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statCards.map((card, i) => (
                    <motion.div
                      key={card.label}
                      custom={i}
                      variants={scaleIn}
                      initial="hidden"
                      animate="visible"
                    >
                      <StatCard
                        icon={card.icon}
                        label={card.label}
                        value={card.value}
                        colorKey={card.colorKey}
                        loading={isLoading}
                      />
                    </motion.div>
                  ))}
                </div>
              );
            })()}

            {/* Charts row */}
            {(() => {
              const src = analyticsData;
              const byStatus = src?.appointmentsByStatus || [];
              const monthlyTrend = src?.monthlyTrend || [];
              const stats = src?.stats || dashData?.stats || {};
              const thisMonth = src?.thisMonthAppointments ?? 0;
              const lastMonth = src?.lastMonthAppointments ?? 0;
              const monthDiff = thisMonth - lastMonth;

              // Build donut data from appointmentsByStatus
              const STATUS_COLORS = {
                completed: "#10b981",
                pending: "#f59e0b",
                confirmed: "#3b82f6",
                cancelled: "#ef4444",
              };
              const donutData = byStatus.map((s) => ({
                label: s._id.charAt(0).toUpperCase() + s._id.slice(1),
                value: s.count,
                color: STATUS_COLORS[s._id] || "#94a3b8",
              }));

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Donut chart — Appointment Status Breakdown */}
                  <motion.div
                    variants={fadeUp}
                    custom={0}
                    initial="hidden"
                    animate="visible"
                    className="glass-card rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-2 mb-5">
                      <PieChart className="h-4 w-4 text-teal-500" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Appointment Status Breakdown
                      </h3>
                    </div>

                    {analyticsLoading && !analyticsData ? (
                      <div className="flex justify-center py-10">
                        <div className="w-32 h-32 rounded-full border-4 border-gray-100 dark:border-white/5 border-t-teal-500 animate-spin" />
                      </div>
                    ) : donutData.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-10">
                        No appointment data yet.
                      </p>
                    ) : (
                      <div className="flex justify-center">
                        <AnalyticsDonutChart
                          data={donutData}
                          size={200}
                          thickness={34}
                          title="Appointments"
                          total={
                            stats.totalAppointments ??
                            donutData.reduce((a, b) => a + b.value, 0)
                          }
                        />
                      </div>
                    )}
                  </motion.div>

                  {/* Bar chart — Monthly Trend */}
                  <motion.div
                    variants={fadeUp}
                    custom={1}
                    initial="hidden"
                    animate="visible"
                    className="glass-card rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-teal-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Monthly Appointment Trend
                        </h3>
                      </div>
                      {/* Month-over-month badge */}
                      {(thisMonth > 0 || lastMonth > 0) && (
                        <span
                          className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            monthDiff > 0
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : monthDiff < 0
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                                : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                          }`}
                        >
                          {monthDiff > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : monthDiff < 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : null}
                          {monthDiff > 0 ? "+" : ""}
                          {monthDiff} vs last month
                        </span>
                      )}
                    </div>

                    {analyticsLoading && !analyticsData ? (
                      <div className="flex items-end gap-2 h-36 px-1 mt-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t-lg animate-pulse bg-gray-200 dark:bg-white/10"
                            style={{ height: `${40 + Math.random() * 60}%` }}
                          />
                        ))}
                      </div>
                    ) : monthlyTrend.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-10">
                        No trend data yet.
                      </p>
                    ) : (
                      <div className="mt-4">
                        <AnalyticsBarChart
                          data={monthlyTrend}
                          color="#0d9488"
                          height={150}
                          label="Appointments per month"
                        />
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })()}

            {/* Completion rate + extra KPI pills */}
            {(() => {
              const src = analyticsData || dashData;
              const stats = src?.stats || {};
              const {
                totalAppointments = 0,
                completedAppointments = 0,
                cancelledAppointments = 0,
                pendingAppointments = 0,
              } = stats;
              const completionRate =
                totalAppointments > 0
                  ? Math.round(
                      (completedAppointments / totalAppointments) * 100,
                    )
                  : 0;
              const cancellationRate =
                totalAppointments > 0
                  ? Math.round(
                      (cancelledAppointments / totalAppointments) * 100,
                    )
                  : 0;

              const kpis = [
                {
                  label: "Completion Rate",
                  value: `${completionRate}%`,
                  pct: completionRate,
                  color: "#10b981",
                  bg: "bg-emerald-100 dark:bg-emerald-900/20",
                  text: "text-emerald-700 dark:text-emerald-300",
                },
                {
                  label: "Cancellation Rate",
                  value: `${cancellationRate}%`,
                  pct: cancellationRate,
                  color: "#ef4444",
                  bg: "bg-rose-100 dark:bg-rose-900/20",
                  text: "text-rose-700 dark:text-rose-300",
                },
                {
                  label: "Pending",
                  value: pendingAppointments,
                  pct:
                    totalAppointments > 0
                      ? Math.min(
                          (pendingAppointments / totalAppointments) * 100,
                          100,
                        )
                      : 0,
                  color: "#f59e0b",
                  bg: "bg-amber-100 dark:bg-amber-900/20",
                  text: "text-amber-700 dark:text-amber-300",
                },
              ];

              return (
                <motion.div
                  variants={fadeUp}
                  custom={2}
                  initial="hidden"
                  animate="visible"
                  className="glass-card rounded-2xl p-6"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">
                    Performance Overview
                  </h3>
                  <div className="space-y-4">
                    {kpis.map((kpi, i) => (
                      <div key={kpi.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {kpi.label}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${kpi.bg} ${kpi.text}`}
                          >
                            {kpi.value}
                          </span>
                        </div>
                        <div className="relative h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${kpi.pct}%` }}
                            transition={{
                              delay: 0.3 + i * 0.1,
                              duration: 0.8,
                              ease: [0.4, 0, 0.2, 1],
                            }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: kpi.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}

        {/* ── MEETINGS ──────────────────────────────────────────────────── */}
        {section === "Meetings" && (
          <div className="space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-between"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Video className="h-5 w-5 text-teal-500" />
                  Video Meetings
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  All patients with video call appointments
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleTestEmail}
                  disabled={testEmailLoading}
                  title="Send a test email to verify SMTP is working"
                  className="h-9 px-3 rounded-xl border border-teal-500 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {testEmailLoading ? "Sending…" : "✉ Test Email"}
                </button>
                <button
                  onClick={handleTriggerReminder}
                  disabled={reminderLoading}
                  title="Manually fire the 10-min reminder check now"
                  className="h-9 px-3 rounded-xl border border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {reminderLoading ? "Checking…" : "⏰ Trigger Reminder"}
                </button>
                <button
                  onClick={loadMeetings}
                  className="h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-md shadow-teal-600/20"
                >
                  Refresh
                </button>
              </div>
            </motion.div>

            {/* Cards */}
            {meetingsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="glass-card rounded-2xl p-5 animate-pulse"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-white/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 rounded bg-gray-200 dark:bg-white/10 w-3/4" />
                        <div className="h-2.5 rounded bg-gray-200 dark:bg-white/10 w-1/2" />
                      </div>
                    </div>
                    <div className="h-24 rounded-xl bg-gray-200 dark:bg-white/10 mb-4" />
                    <div className="h-10 rounded-xl bg-gray-200 dark:bg-white/10" />
                  </div>
                ))}
              </div>
            ) : meetings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl p-16 flex flex-col items-center gap-3"
              >
                <div className="h-20 w-20 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <Video className="h-10 w-10 text-teal-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  No video appointments
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs text-center max-w-xs">
                  Patients who book video call appointments will appear here
                  with their meeting links.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {meetings.map((appt, idx) => {
                  const patient = appt.patientProfile;
                  const name =
                    patient?.fullName ||
                    appt.patient?.fullName ||
                    "Unknown Patient";
                  const initials =
                    name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0].toUpperCase())
                      .join("") || "?";
                  const email = appt.patient?.email || "";
                  const phone = appt.patient?.phone || "";
                  const apptDate = appt.date
                    ? new Date(appt.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";
                  const meetingUrl = `https://meet.jit.si/CareLine360-${appt._id}`;
                  const joinable = canJoinMeeting(appt);
                  const isPast =
                    appt.status === "completed" ||
                    appt.status === "cancelled" ||
                    (() => {
                      const d = new Date(appt.date);
                      const [hh, mm] = (appt.time || "00:00")
                        .split(":")
                        .map(Number);
                      const apptDT = new Date(
                        d.getFullYear(),
                        d.getMonth(),
                        d.getDate(),
                        hh,
                        mm,
                      );
                      return apptDT.getTime() + 90 * 60 * 1000 < Date.now();
                    })();

                  // Dim if marked complete locally or already completed/cancelled
                  const isDimmed =
                    completedMeetingIds.has(appt._id) ||
                    appt.status === "completed" ||
                    appt.status === "cancelled";

                  const statusColors = {
                    confirmed:
                      "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                    pending:
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    completed:
                      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    cancelled:
                      "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  };
                  const statusColor =
                    statusColors[appt.status] || "bg-gray-500/10 text-gray-500";

                  // Live timer
                  const secsLeft =
                    meetingTimers[appt._id] ?? getSecondsUntil(appt);
                  const timerLabel = formatSecondsUntil(secsLeft);
                  // Within 10 min before → highlight timer in amber; otherwise teal
                  const timerHot = secsLeft >= 0 && secsLeft <= 600;

                  return (
                    <motion.div
                      key={appt._id}
                      custom={idx}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className={`relative glass-card rounded-2xl p-5 flex flex-col gap-4
                        transition-all duration-500
                        ${
                          isDimmed
                            ? "opacity-50 grayscale"
                            : "hover:shadow-xl hover:shadow-teal-500/15 hover:-translate-y-1 hover:scale-[1.01] border border-transparent hover:border-teal-500/20"
                        }`}
                    >
                      {/* Completed overlay badge — covers content only, NOT the action bar */}
                      {isDimmed && (
                        <div className="absolute inset-x-0 top-0 bottom-[60px] rounded-t-2xl pointer-events-none z-10 flex items-center justify-center">
                          <div className="bg-black/30 dark:bg-black/50 backdrop-blur-sm rounded-t-2xl absolute inset-0" />
                          <span className="relative z-20 px-4 py-1.5 rounded-full bg-emerald-600/90 text-white text-xs font-bold tracking-wide flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Completed
                          </span>
                        </div>
                      )}

                      {/* Patient info row */}
                      <div className="flex items-center gap-3">
                        {patient?.avatarUrl ? (
                          <img
                            src={patient.avatarUrl}
                            alt={name}
                            className="h-14 w-14 rounded-full object-cover ring-2 ring-teal-400/30 shrink-0"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-lg font-bold shrink-0 ring-2 ring-teal-400/20">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
                            {name}
                          </p>
                          {patient?.patientId && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400">
                              {patient.patientId}
                            </span>
                          )}
                          {email && (
                            <p className="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
                              <Mail className="h-3 w-3 shrink-0" />
                              {email}
                            </p>
                          )}
                          {phone && (
                            <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                              <Phone className="h-3 w-3 shrink-0" />
                              {phone}
                            </p>
                          )}
                        </div>
                        {/* Status badge */}
                        <span
                          className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColor}`}
                        >
                          {appt.status?.charAt(0).toUpperCase() +
                            appt.status?.slice(1)}
                        </span>
                      </div>

                      {/* Live countdown timer */}
                      <div
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold
                          ${
                            timerLabel === null && secsLeft > -90 * 60
                              ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-600 dark:text-emerald-400"
                              : timerHot && timerLabel !== null
                                ? "bg-amber-500/10 border-amber-400/30 text-amber-600 dark:text-amber-400"
                                : isPast
                                  ? "bg-gray-500/10 border-gray-400/20 text-gray-500 dark:text-gray-400"
                                  : "bg-teal-500/5 border-teal-400/20 text-teal-600 dark:text-teal-400"
                          }`}
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {timerLabel !== null ? (
                          <span className="tabular-nums">
                            Starts in{" "}
                            <span
                              className={`font-mono font-bold ${timerHot ? "text-amber-700 dark:text-amber-300" : ""}`}
                            >
                              {timerLabel}
                            </span>
                          </span>
                        ) : secsLeft > -90 * 60 ? (
                          <span className="font-bold animate-pulse">
                            🟢 Meeting is live — join now!
                          </span>
                        ) : (
                          <span>Meeting has ended</span>
                        )}
                      </div>

                      {/* Date / Time / Priority row */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-black/5 dark:bg-white/5 px-2.5 py-2">
                          <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 mb-0.5">
                            <CalendarDays className="h-3 w-3" />
                            <span className="text-[9px] font-semibold uppercase tracking-wide">
                              Date
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-gray-900 dark:text-white">
                            {apptDate}
                          </p>
                        </div>
                        <div className="rounded-xl bg-black/5 dark:bg-white/5 px-2.5 py-2">
                          <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 mb-0.5">
                            <Clock className="h-3 w-3" />
                            <span className="text-[9px] font-semibold uppercase tracking-wide">
                              Time
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-gray-900 dark:text-white">
                            {appt.time || "—"}
                          </p>
                        </div>
                        <div className="rounded-xl bg-black/5 dark:bg-white/5 px-2.5 py-2">
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 mb-0.5">
                            <Activity className="h-3 w-3" />
                            <span className="text-[9px] font-semibold uppercase tracking-wide">
                              Priority
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-gray-900 dark:text-white capitalize">
                            {appt.priority || "—"}
                          </p>
                        </div>
                      </div>

                      {/* Symptoms / Notes */}
                      {(appt.symptoms || appt.notes) && (
                        <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {appt.symptoms || appt.notes}
                        </div>
                      )}

                      {/* Meeting link — disabled/locked until 10-min window */}
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border
                          ${
                            joinable
                              ? "bg-teal-500/5 border-teal-400/20"
                              : "bg-gray-100/50 dark:bg-white/5 border-gray-300/30 dark:border-white/10"
                          }`}
                        title={
                          !joinable
                            ? "Link is locked — available 10 minutes before the meeting"
                            : undefined
                        }
                      >
                        {joinable ? (
                          <Video className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                        ) : (
                          /* Lock icon (inline SVG — no extra import needed) */
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 text-gray-400 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="11"
                              width="18"
                              height="11"
                              rx="2"
                              ry="2"
                            />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        )}
                        <span
                          className={`text-[10px] font-mono truncate flex-1 ${
                            joinable
                              ? "text-teal-600 dark:text-teal-400"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {joinable
                            ? meetingUrl
                            : "🔒 Locked — available 10 min before"}
                        </span>
                        {/* Open-in-new-tab: only works when joinable */}
                        {joinable ? (
                          <a
                            href={meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-teal-500 hover:text-teal-400 transition-colors"
                            title="Open meeting link"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <ExternalLink className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-white/10">
                        {/* Join button */}
                        <button
                          onClick={() => joinable && startCountdown(appt._id)}
                          disabled={!joinable || isPast}
                          title={
                            isPast
                              ? "Meeting has ended"
                              : !joinable
                                ? "Available 10 minutes before the meeting"
                                : "Join video meeting"
                          }
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                            text-[12px] font-semibold transition-all duration-200 active:scale-95
                            ${
                              joinable && !isPast
                                ? "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/25"
                                : "bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60"
                            }`}
                        >
                          <Video className="h-4 w-4" />
                          {isPast
                            ? "Ended"
                            : joinable
                              ? "Join Now"
                              : "Join (−10 min)"}
                        </button>

                        {/* Mark Complete — only after meeting start time has passed */}
                        {!isDimmed && secsLeft <= 0 && (
                          <button
                            onClick={() => handleMarkComplete(appt._id)}
                            title="Mark meeting as completed"
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl
                              text-[12px] font-semibold
                              bg-emerald-500/10 text-emerald-600 dark:text-emerald-400
                              hover:bg-emerald-500/25 hover:shadow-md hover:shadow-emerald-500/20
                              transition-all duration-200 active:scale-95"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete — only visible after marking complete */}
                        {isDimmed && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Remove this meeting record? This cannot be undone.",
                                )
                              ) {
                                handleDeleteMeeting(appt._id);
                              }
                            }}
                            title="Delete completed meeting"
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl
                              text-[12px] font-semibold
                              bg-rose-500/10 text-rose-600 dark:text-rose-400
                              hover:bg-rose-500/25 hover:shadow-md hover:shadow-rose-500/20
                              transition-all duration-200 active:scale-95"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
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

        {/* ── Delete confirmation modal ─────────────────────────────── */}
        {deleteConfirmId &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setDeleteConfirmId(null)}
            >
              <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm p-6 flex flex-col gap-5 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-500/15 mx-auto">
                  <svg
                    className="w-7 h-7 text-rose-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                {/* Text */}
                <div className="text-center">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                    Delete Appointment
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This appointment will be permanently removed. This action
                    cannot be undone.
                  </p>
                </div>
                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteAppointment}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-lg shadow-rose-500/25"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </>
  );
}
