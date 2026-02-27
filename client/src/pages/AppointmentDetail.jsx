import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getRole } from "../auth/authStorage";
import { useToast } from "../context/ToastContext";
import { getAppointmentById, transitionStatus } from "../api/appointmentApi";
import { getPaymentByAppointment, verifyPayment, failPayment } from "../api/paymentApi";
import { StatusBadge, PriorityBadge } from "../components/ui/StatusBadge";
import PaymentSummary from "../components/payments/PaymentSummary";
import RescheduleModal from "../components/appointments/RescheduleModal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatDate } from "../utils/formatDate";
import { displayName } from "../utils/displayName";

export default function AppointmentDetail() {
  const { id } = useParams();
  const currentUserRole = getRole();
  const toast = useToast();
  const [appointment, setAppointment] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAppointmentById(id);
        setAppointment(res.data.data);

        try {
          const payRes = await getPaymentByAppointment(id);
          setPayment(payRes.data.data);
        } catch {
          // No payment yet
        }
      } catch (err) {
        console.error("Failed to load appointment:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleStatusChange = async (status) => {
    setActionLoading(true);
    try {
      const res = await transitionStatus(id, status);
      setAppointment(res.data.data);
      if (status === "confirmed") toast.success("Appointment confirmed");
      if (status === "completed") toast.success("Appointment marked as completed");
    } catch (err) {
      toast.error("Failed to update appointment status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    setActionLoading(true);
    try {
      const res = await verifyPayment(payment._id);
      setPayment(res.data.data);
      toast.success("Payment verified");
    } catch (err) {
      toast.error("Payment verification failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFailPayment = async () => {
    setActionLoading(true);
    try {
      const res = await failPayment(payment._id);
      setPayment(res.data.data);
    } catch (err) {
      toast.error("Failed to update payment");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!appointment) return <div className="text-center py-8 text-sm text-gray-500">Appointment not found</div>;

  const { patient, doctor, date, time, consultationType, symptoms, notes, status, priority, rescheduleHistory } = appointment;
  const isDoctor = currentUserRole === "doctor";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Appointment Details</h1>
        <Link to="/appointments" className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Main content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Overview */}
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Overview</h2>
              <div className="flex items-center gap-1.5">
                <PriorityBadge priority={priority} />
                <StatusBadge status={status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400">Patient</span>
                <p className="font-medium text-gray-800 mt-0.5">{displayName(patient)}</p>
              </div>
              <div>
                <span className="text-gray-400">Doctor</span>
                <p className="font-medium text-gray-800 mt-0.5">{displayName(doctor)}</p>
                {doctor?.specialization && (
                  <p className="text-[11px] text-gray-400">{doctor.specialization}</p>
                )}
              </div>
              <div>
                <span className="text-gray-400">Date</span>
                <p className="font-medium text-gray-800 mt-0.5">{formatDate(date)}</p>
              </div>
              <div>
                <span className="text-gray-400">Time</span>
                <p className="font-medium text-gray-800 mt-0.5">{time}</p>
              </div>
              <div>
                <span className="text-gray-400">Type</span>
                <p className="font-medium text-gray-800 mt-0.5 capitalize">{consultationType}</p>
              </div>
            </div>

            {symptoms && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">Symptoms</span>
                <p className="text-xs mt-0.5 text-gray-700">{symptoms}</p>
              </div>
            )}

            {notes && (
              <div className="mt-2">
                <span className="text-xs text-gray-400">Notes</span>
                <p className="text-xs mt-0.5 text-gray-700">{notes}</p>
              </div>
            )}
          </div>

          {/* Reschedule History */}
          {rescheduleHistory?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Reschedule History</h3>
              <div className="space-y-1.5">
                {rescheduleHistory.map((h, i) => (
                  <div key={i} className="text-xs text-gray-600 border-l-2 border-yellow-400 pl-2.5 py-0.5">
                    {formatDate(h.previousDate)} at {h.previousTime}
                    <span className="text-[11px] text-gray-400 ml-1.5">
                      (changed {new Date(h.rescheduledAt).toLocaleDateString()})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Actions</h3>
            <div className="flex flex-wrap gap-1.5">
              {isDoctor && status === "pending" && (
                <button
                  onClick={() => handleStatusChange("confirmed")}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  Confirm
                </button>
              )}

              {isDoctor && status === "confirmed" && (
                <button
                  onClick={() => handleStatusChange("completed")}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  Complete
                </button>
              )}

              {status === "confirmed" && (
                <Link
                  to={`/appointments/${id}/chat`}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Chat
                </Link>
              )}

              {status === "confirmed" && (
                <button
                  onClick={() => setShowReschedule(true)}
                  className="px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 font-medium"
                >
                  Reschedule
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Payment */}
        <div className="lg:col-span-2 space-y-4">
          {payment ? (
            <>
              <PaymentSummary payment={payment} />
              {payment.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={handleVerifyPayment}
                    disabled={actionLoading}
                    className="flex-1 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    Verify
                  </button>
                  <button
                    onClick={handleFailPayment}
                    disabled={actionLoading}
                    className="flex-1 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                  >
                    Fail
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Payment</h3>
              <p className="text-xs text-gray-500 mb-2.5">No payment created yet.</p>
              <Link
                to={`/appointments/${id}/payment`}
                className="block w-full py-1.5 bg-blue-600 text-white text-xs text-center rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Payment ($50.00)
              </Link>
            </div>
          )}
        </div>
      </div>

      {showReschedule && (
        <RescheduleModal
          appointment={appointment}
          isOpen={showReschedule}
          onClose={() => setShowReschedule(false)}
          onRescheduled={(updated) => {
            setAppointment(updated);
            setShowReschedule(false);
            toast.success("Appointment rescheduled");
          }}
        />
      )}
    </div>
  );
}
