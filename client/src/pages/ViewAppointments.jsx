import { useState, useEffect, useCallback } from "react";
import { getRole } from "../auth/authStorage";
import { useToast } from "../context/ToastContext";
import { getAppointments, transitionStatus } from "../api/appointmentApi";
import AppointmentCard from "../components/appointments/AppointmentCard";
import AppointmentFilters from "../components/appointments/AppointmentFilters";
import RescheduleModal from "../components/appointments/RescheduleModal";
import CancelConfirmModal from "../components/appointments/CancelConfirmModal";
import Pagination from "../components/ui/Pagination";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";

export default function ViewAppointments() {
  const currentUserRole = getRole();
  const currentUserId = localStorage.getItem("userId");
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ sort: "-date", page: 1, limit: 10 });
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const fetchAppointments = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const params = { ...filters };
      if (currentUserRole === "patient") params.patient = currentUserId;
      if (currentUserRole === "doctor") params.doctor = currentUserId;
      // Exclude completed and cancelled (those go to history)
      if (!params.status) {
        params.status = "pending,confirmed".split(",").join(",");
      }

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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Appointments</h1>
      <p className="text-sm text-gray-400 mb-6">View and manage your upcoming appointments.</p>

      <AppointmentFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <LoadingSpinner />
      ) : appointments.length === 0 ? (
        <EmptyState message="No appointments found" />
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div key={apt._id}>
              <AppointmentCard
                appointment={apt}
                currentUserRole={currentUserRole}
                onReschedule={setRescheduleTarget}
                onCancel={setCancelTarget}
              />
              {currentUserRole === "doctor" && apt.status === "pending" && (
                <div className="mt-1 ml-4">
                  <button
                    onClick={() => handleConfirm(apt)}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                  >
                    Confirm
                  </button>
                </div>
              )}
              {currentUserRole === "doctor" && apt.status === "confirmed" && (
                <div className="mt-1 ml-4">
                  <button
                    onClick={() => handleComplete(apt)}
                    className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm"
                  >
                    Mark Complete
                  </button>
                </div>
              )}
            </div>
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
