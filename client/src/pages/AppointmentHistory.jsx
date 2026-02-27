import { useState, useEffect, useCallback } from "react";
import { getRole } from "../auth/authStorage";
import { getAppointments } from "../api/appointmentApi";
import AppointmentCard from "../components/appointments/AppointmentCard";
import Pagination from "../components/ui/Pagination";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function AppointmentHistory() {
  const currentUserRole = getRole();
  const currentUserId = localStorage.getItem("userId");
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchHistory = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const params = { page, limit: 10, sort: "-date" };
      if (currentUserRole === "patient") params.patient = currentUserId;
      if (currentUserRole === "doctor") params.doctor = currentUserId;

      const [completedRes, cancelledRes] = await Promise.all([
        getAppointments({ ...params, status: "completed" }),
        getAppointments({ ...params, status: "cancelled" }),
      ]);

      const all = [
        ...completedRes.data.appointments,
        ...cancelledRes.data.appointments,
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setAppointments(all);
      setPagination({
        total: completedRes.data.pagination.total + cancelledRes.data.pagination.total,
        page,
        limit: 10,
        pages: Math.ceil(
          (completedRes.data.pagination.total + cancelledRes.data.pagination.total) / 10
        ),
      });
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentUserRole, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (!currentUserId) return <LoadingSpinner />;

  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Appointment History</h1>
        <p className="text-xs text-gray-400">
          Review your past consultations.
          {!loading && appointments.length > 0 && (
            <span className="ml-2">
              <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {completed} completed
              </span>
              <span className="text-gray-300 mx-1.5">/</span>
              <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                {cancelled} cancelled
              </span>
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-[3px] border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-gray-400 mt-3">Loading history...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">No past appointments</p>
          <p className="text-xs text-gray-400">Completed and cancelled appointments will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <AppointmentCard key={apt._id} appointment={apt} currentUserRole={currentUserRole} />
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
