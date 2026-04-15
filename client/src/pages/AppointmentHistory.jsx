import { useState, useEffect, useCallback } from "react";
import { getRole } from "../auth/authStorage";
import { getAppointments } from "../api/appointmentApi";
import AppointmentCard from "../components/appointments/AppointmentCard";
import Pagination from "../components/ui/Pagination";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";

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

      // Fetch completed and cancelled separately and merge
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

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Appointment History</h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Review your past consultations.</p>

      {loading ? (
        <LoadingSpinner />
      ) : appointments.length === 0 ? (
        <EmptyState message="No past appointments found" />
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <AppointmentCard key={apt._id} appointment={apt} currentUserRole={currentUserRole} />
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
