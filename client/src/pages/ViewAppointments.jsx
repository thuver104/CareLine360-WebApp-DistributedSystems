import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, CheckCircle, CalendarPlus, Filter, SlidersHorizontal } from "lucide-react";
import { getRole } from "../auth/authStorage";
import { useToast } from "../context/ToastContext";
import { getAppointments, transitionStatus, getAppointmentStats } from "../api/appointmentApi";
import StatCard from "../components/ui/StatCard";
import AppointmentCard from "../components/appointments/AppointmentCard";
import RescheduleModal from "../components/appointments/RescheduleModal";
import CancelConfirmModal from "../components/appointments/CancelConfirmModal";
import Pagination from "../components/ui/Pagination";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const SORT_OPTIONS = [
  { value: "-date", label: "Newest" },
  { value: "date", label: "Oldest" },
  { value: "-priority", label: "Priority" },
];

export default function ViewAppointments() {
  const currentUserRole = getRole();
  const currentUserId = localStorage.getItem("userId");
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ sort: "-date", page: 1, limit: 10, status: "" });
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const params = { ...filters };
      if (currentUserRole === "patient") params.patient = currentUserId;
      if (currentUserRole === "doctor") params.doctor = currentUserId;
      // If "All" tab is selected (empty status), fetch all statuses
      // Otherwise use the selected status filter

      const res = await getAppointments(params);
      setAppointments(res.data.appointments);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentUserRole, filters]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    getAppointmentStats()
      .then((res) => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const handleConfirm = async (appointment) => {
    try {
      await transitionStatus(appointment._id, "confirmed");
      fetchAppointments();
      toast.success("Appointment confirmed");
    } catch (err) {
      toast.error("Failed to confirm appointment");
    }
  };

  const handleComplete = async (appointment) => {
    try {
      await transitionStatus(appointment._id, "completed");
      fetchAppointments();
      toast.success("Appointment marked as completed");
    } catch (err) {
      toast.error("Failed to complete appointment");
    }
  };

  if (!currentUserId) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      {/* Welcome banner */}
      <div className="welcome-banner rounded-2xl px-6 py-5 mb-6">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">My Appointments</h1>
            <p className="text-sm text-white/70">Track, manage and stay on top of your consultations.</p>
          </div>
          {currentUserRole === "patient" && (
            <Link
              to="/appointments/book"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium rounded-xl backdrop-blur-sm transition border border-white/20"
            >
              <CalendarPlus className="w-4 h-4" /> Book New
            </Link>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Calendar, label: "Total", value: stats?.total, colorKey: "teal" },
          { icon: Clock, label: "Pending", value: stats?.pending, colorKey: "amber" },
          { icon: CheckCircle, label: "Confirmed", value: stats?.confirmed, colorKey: "blue" },
          { icon: CheckCircle, label: "Completed", value: stats?.completed, colorKey: "emerald" },
        ].map((card) => (
          <StatCard key={card.label} {...card} loading={statsLoading} />
        ))}
      </div>

      {/* Toolbar: tabs + sort + filter toggle */}
      <div className="glass-card rounded-2xl mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
          {/* Status tabs */}
          <div className="flex gap-1">
            {STATUS_TABS.map((tab) => {
              const isActive = filters.status === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilters((f) => ({ ...f, status: tab.key, page: 1 }))}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? "bg-[#0d9488] text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <select
              value={filters.sort || "-date"}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))}
              className="h-8 pl-2 pr-7 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
                showFilters
                  ? "bg-[#0d9488] text-white"
                  : "bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ring-1 ring-gray-200 dark:ring-white/10"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable date filters */}
        {showFilters && (
          <div className="px-4 py-3 grid grid-cols-2 gap-3 animate-fade-in">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">From</label>
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))}
                className="w-full h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-2.5 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">To</label>
              <input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value, page: 1 }))}
                className="w-full h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-2.5 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition"
              />
            </div>
          </div>
        )}
      </div>

      {/* Appointment list */}
      {loading ? (
        <div className="flex flex-col items-center py-16">
          <div className="w-10 h-10 border-[3px] border-teal-100 dark:border-teal-900 border-t-[#0d9488] rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="glass-card rounded-2xl text-center py-16 px-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center">
            <Calendar className="w-7 h-7 text-[#0d9488]" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-1">No appointments found</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
            {filters.status ? "Try changing your filters." : "You don't have any upcoming appointments."}
          </p>
          {currentUserRole === "patient" && (
            <Link
              to="/appointments/book"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0d9488] text-white text-sm font-medium rounded-xl hover:bg-[#0b7c72] active:scale-[0.98] transition shadow-sm"
            >
              <CalendarPlus className="w-4 h-4" /> Book Appointment
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <AppointmentCard
              key={apt._id}
              appointment={apt}
              currentUserRole={currentUserRole}
              onReschedule={setRescheduleTarget}
              onCancel={setCancelTarget}
              onConfirm={currentUserRole === "doctor" ? handleConfirm : undefined}
              onComplete={currentUserRole === "doctor" ? handleComplete : undefined}
            />
          ))}
        </div>
      )}

      <Pagination
        pagination={pagination}
        onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
      />

      {rescheduleTarget && (
        <RescheduleModal
          appointment={rescheduleTarget}
          isOpen={!!rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={() => {
            setRescheduleTarget(null);
            fetchAppointments();
            toast.success("Appointment rescheduled");
          }}
        />
      )}

      {cancelTarget && (
        <CancelConfirmModal
          appointment={cancelTarget}
          isOpen={!!cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={() => {
            setCancelTarget(null);
            fetchAppointments();
            toast.success("Appointment cancelled");
          }}
        />
      )}
    </div>
  );
}
