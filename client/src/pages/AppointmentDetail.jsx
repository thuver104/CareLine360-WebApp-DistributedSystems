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
  if (!appointment) return <div className="text-center py-12 text-gray-500">Appointment not found</div>;

  const { patient, doctor, date, time, consultationType, symptoms, notes, status, priority, rescheduleHistory } = appointment;
  const isDoctor = currentUserRole === "doctor";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
        <Link to="/appointments" className="text-sm text-gray-500 hover:text-blue-600 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Appointments</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold">Overview</h2>
              <div className="flex space-x-2">
                <PriorityBadge priority={priority} />
                <StatusBadge status={status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Patient:</span>
                <p className="font-medium">{displayName(patient)}</p>
              </div>
              <div>
                <span className="text-gray-500">Doctor:</span>
                <p className="font-medium">{displayName(doctor)}</p>
                <p className="text-xs text-gray-400">{doctor?.specialization}</p>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>
                <p className="font-medium">{formatDate(date)}</p>
              </div>
              <div>
                <span className="text-gray-500">Time:</span>
                <p className="font-medium">{time}</p>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="font-medium capitalize">{consultationType}</p>
              </div>
            </div>

            {symptoms && (
              <div className="mt-4">
                <span className="text-sm text-gray-500">Symptoms:</span>
                <p className="text-sm mt-1">{symptoms}</p>
              </div>
            )}

            {notes && (
              <div className="mt-3">
                <span className="text-sm text-gray-500">Notes:</span>
                <p className="text-sm mt-1">{notes}</p>
              </div>
            )}
          </div>

          {rescheduleHistory?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6">
              <h3 className="font-semibold mb-3">Reschedule History</h3>
              <div className="space-y-2">
                {rescheduleHistory.map((h, i) => (
                  <div key={i} className="text-sm text-gray-600 border-l-2 border-yellow-400 pl-3">
                    Previously: {formatDate(h.previousDate)} at {h.previousTime}
                    <span className="text-xs text-gray-400 ml-2">
                      (changed {new Date(h.rescheduledAt).toLocaleDateString()})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6">
            <h3 className="font-semibold mb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {isDoctor && status === "pending" && (
                <button
                  onClick={() => handleStatusChange("confirmed")}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                >
                  Confirm Appointment
                </button>
              )}

              {isDoctor && status === "confirmed" && (
                <button
                  onClick={() => handleStatusChange("completed")}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm"
                >
                  Mark as Completed
                </button>
              )}

              {status === "confirmed" && (
                <Link
                  to={`/appointments/${id}/chat`}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 shadow-sm"
                >
                  Open Chat
                </Link>
              )}

              {status === "confirmed" && (
                <button
                  onClick={() => setShowReschedule(true)}
                  className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 shadow-sm"
                >
                  Reschedule
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Payment */}
        <div className="space-y-4">
          {payment ? (
            <>
              <PaymentSummary payment={payment} />
              {payment.status === "pending" && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleVerifyPayment}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm"
                  >
                    Simulate Verify
                  </button>
                  <button
                    onClick={handleFailPayment}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 shadow-sm"
                  >
                    Simulate Fail
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6">
              <h3 className="font-semibold mb-3">Payment</h3>
              <p className="text-sm text-gray-500 mb-3">No payment created yet.</p>
              <Link
                to={`/appointments/${id}/payment`}
                className="block w-full py-2 bg-blue-600 text-white text-sm text-center rounded-lg hover:bg-blue-700 shadow-sm"
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
