import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getRole } from "../auth/authStorage";
import { useToast } from "../context/ToastContext";
import { getAppointmentById, transitionStatus } from "../api/appointmentApi";
import { getPaymentByAppointment, verifyPayment, failPayment } from "../api/paymentApi";
import PaymentSummary from "../components/payments/PaymentSummary";
import RescheduleModal from "../components/appointments/RescheduleModal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatDate } from "../utils/formatDate";
import { displayName } from "../utils/displayName";

const STATUS_STYLE = {
  pending: "bg-amber-50 text-amber-600 ring-amber-200/60",
  confirmed: "bg-sky-50 text-sky-600 ring-sky-200/60",
  completed: "bg-emerald-50 text-emerald-600 ring-emerald-200/60",
  cancelled: "bg-rose-50 text-rose-500 ring-rose-200/60",
};

const PRIORITY_STYLE = {
  low: "bg-gray-50 text-gray-500 ring-gray-200/60",
  medium: "bg-amber-50 text-amber-600 ring-amber-200/60",
  high: "bg-orange-50 text-orange-600 ring-orange-200/60",
  urgent: "bg-red-50 text-red-600 ring-red-200/60",
};

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

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
  if (!appointment)
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-400">Appointment not found</p>
      </div>
    );

  const { patient, doctor, date, time, consultationType, symptoms, notes, status, priority, rescheduleHistory } = appointment;
  const isDoctor = currentUserRole === "doctor";
  const doctorName = displayName(doctor);
  const patientName = displayName(patient);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        to="/appointments"
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 font-medium mb-4 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Appointments
      </Link>

      {/* Hero card */}
      <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 rounded-2xl p-5 mb-5 shadow-lg shadow-blue-500/15 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -left-4 -bottom-10 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg shadow-inner">
            {getInitials(isDoctor ? patientName : doctorName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base truncate">
              {isDoctor ? patientName : `Dr. ${doctorName}`}
            </p>
            {!isDoctor && doctor?.specialization && (
              <p className="text-white/60 text-xs">{doctor.specialization}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 capitalize ${STATUS_STYLE[status]}`}>
                {status}
              </span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 capitalize ${PRIORITY_STYLE[priority]}`}>
                {priority}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Main */}
        <div className="lg:col-span-3 space-y-4">
          {/* Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-black/[0.04] shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoField
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                label="Patient"
                value={patientName}
              />
              <InfoField
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                label="Doctor"
                value={`Dr. ${doctorName}`}
                sub={doctor?.specialization}
              />
              <InfoField
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                label="Date"
                value={formatDate(date)}
              />
              <InfoField
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                label="Time"
                value={time}
              />
              <InfoField
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                }
                label="Type"
                value={consultationType}
                capitalize
              />
            </div>

            {symptoms && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Symptoms</p>
                <p className="text-sm text-gray-700 leading-relaxed">{symptoms}</p>
              </div>
            )}
            {notes && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Notes</p>
                <p className="text-sm text-gray-700 leading-relaxed">{notes}</p>
              </div>
            )}
          </div>

          {/* Reschedule History */}
          {rescheduleHistory?.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-black/[0.04] shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Reschedule History</h2>
              <div className="space-y-2">
                {rescheduleHistory.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-xs bg-amber-50/50 rounded-xl px-3.5 py-2.5 ring-1 ring-amber-200/30"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">
                        {formatDate(h.previousDate)} at {h.previousTime}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Changed {new Date(h.rescheduledAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-black/[0.04] shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Actions</h2>
            <div className="flex flex-wrap gap-2">
              {isDoctor && status === "pending" && (
                <button
                  onClick={() => handleStatusChange("confirmed")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 shadow-md shadow-blue-500/20 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm
                </button>
              )}

              {isDoctor && status === "confirmed" && (
                <button
                  onClick={() => handleStatusChange("completed")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-semibold rounded-xl hover:from-emerald-600 hover:to-green-600 disabled:opacity-50 shadow-md shadow-emerald-500/20 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Complete
                </button>
              )}

              {status === "confirmed" && (
                <Link
                  to={`/appointments/${id}/chat`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-600 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Chat
                </Link>
              )}

              {status === "confirmed" && (
                <button
                  onClick={() => setShowReschedule(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 ring-1 ring-amber-200/60 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
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
                    className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-semibold rounded-xl hover:from-emerald-600 hover:to-green-600 disabled:opacity-50 shadow-sm shadow-emerald-500/20 transition-all"
                  >
                    Verify
                  </button>
                  <button
                    onClick={handleFailPayment}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-semibold rounded-xl hover:from-rose-600 hover:to-red-600 disabled:opacity-50 shadow-sm shadow-rose-500/20 transition-all"
                  >
                    Fail
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-black/[0.04] shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Payment</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">No payment created yet.</p>
              <Link
                to={`/appointments/${id}/payment`}
                className="block w-full py-2 text-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-md shadow-blue-500/20 transition-all"
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

function InfoField({ icon, label, value, sub, capitalize }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-blue-50/80 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium text-gray-800 truncate ${capitalize ? "capitalize" : ""}`}>{value}</p>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}
