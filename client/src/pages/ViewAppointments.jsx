import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getRole } from "../auth/authStorage";
import { useToast } from "../context/ToastContext";
import { getAppointments, transitionStatus } from "../api/appointmentApi";
import AppointmentCard from "../components/appointments/AppointmentCard";
import AppointmentFilters from "../components/appointments/AppointmentFilters";
import RescheduleModal from "../components/appointments/RescheduleModal";
import CancelConfirmModal from "../components/appointments/CancelConfirmModal";
import Pagination from "../components/ui/Pagination";
import LoadingSpinner from "../components/ui/LoadingSpinner";

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
      if (!params.status) {
        params.status = "pending,confirmed";
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

  const pending = appointments.filter((a) => a.status === "pending").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-gray-900">My Appointments</h1>
          <Link
            to="/appointments/book"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Book New
          </Link>
        </div>
        <p className="text-xs text-gray-400">
          Manage your upcoming consultations.
          {!loading && appointments.length > 0 && (
            <span className="ml-2">
              <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {pending} pending
              </span>
              <span className="text-gray-300 mx-1.5">/</span>
              <span className="inline-flex items-center gap-1 text-sky-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                {confirmed} confirmed
              </span>
            </span>
          )}
        </p>
      </div>

      <AppointmentFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-[3px] border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-gray-400 mt-3">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">No appointments found</p>
          <p className="text-xs text-gray-400 mb-4">Book a new appointment to get started.</p>
          <Link
            to="/appointments/book"
            className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors"
          >
            Book an appointment &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <div key={apt._id}>
              <AppointmentCard
                appointment={apt}
                currentUserRole={currentUserRole}
                onReschedule={setRescheduleTarget}
                onCancel={setCancelTarget}
              />
              {currentUserRole === "doctor" && apt.status === "pending" && (
                <div className="mt-1.5 ml-[3.75rem]">
                  <button
                    onClick={() => handleConfirm(apt)}
                    className="text-[11px] px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 font-medium shadow-sm shadow-blue-500/20"
                  >
                    Confirm
                  </button>
                </div>
              )}
              {currentUserRole === "doctor" && apt.status === "confirmed" && (
                <div className="mt-1.5 ml-[3.75rem]">
                  <button
                    onClick={() => handleComplete(apt)}
                    className="text-[11px] px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 font-medium shadow-sm shadow-emerald-500/20"
                  >
                    Complete
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
