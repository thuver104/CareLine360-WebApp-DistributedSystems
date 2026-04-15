import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Star, Download, Calendar, Clock, Video, User, Phone,
  Stethoscope, FileText, MessageSquare, RefreshCw, CheckCircle,
  CircleDot, Circle, CreditCard, AlertTriangle
} from "lucide-react";
import { getRole } from "../auth/authStorage";
import { useToast } from "../context/ToastContext";
import { getAppointmentById, transitionStatus, getAppointmentRating } from "../api/appointmentApi";
import { getPaymentByAppointment, verifyPayment, failPayment, downloadReceipt } from "../api/paymentApi";
import { StatusBadge, PriorityBadge } from "../components/ui/StatusBadge";
import PaymentSummary from "../components/payments/PaymentSummary";
import RescheduleModal from "../components/appointments/RescheduleModal";
import RatingModal from "../components/appointments/RatingModal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ChatFab from "../components/chat/ChatFab";
import { formatDate } from "../utils/formatDate";
import { displayName } from "../utils/displayName";
import { getInitials } from "../utils/colors";

const TYPE_ICON = { video: Video, "in-person": User, phone: Phone };
const TYPE_LABEL = { video: "Video Call", "in-person": "In Person", phone: "Phone Call" };

const STATUS_STEPS = ["pending", "confirmed", "completed"];
const STATUS_LABEL = { pending: "Pending", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" };

function StatusProgress({ status }) {
  const isCancelled = status === "cancelled";
  const currentIdx = STATUS_STEPS.indexOf(status);

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-500/20">
        <AlertTriangle className="w-4 h-4 text-rose-500" />
        <span className="text-sm font-medium text-rose-700 dark:text-rose-300">This appointment has been cancelled</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                done ? "bg-[#0d9488] text-white" : active ? "bg-[#0d9488] text-white ring-4 ring-[#0d9488]/20" : "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500"
              }`}>
                {done ? <CheckCircle className="w-4 h-4" /> : active ? <CircleDot className="w-4 h-4" /> : <Circle className="w-3.5 h-3.5" />}
              </div>
              <span className={`mt-1 text-[10px] font-semibold ${active ? "text-[#0d9488] dark:text-teal-400" : done ? "text-gray-600 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>
                {STATUS_LABEL[step]}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`w-10 sm:w-16 h-0.5 mx-1 -mt-4 ${i < currentIdx ? "bg-[#0d9488]" : "bg-gray-200 dark:bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
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
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAppointmentById(id);
        setAppointment(res.data.data);
        try { const payRes = await getPaymentByAppointment(id); setPayment(payRes.data.data); } catch {}
        try { const ratingRes = await getAppointmentRating(id); if (ratingRes.data.data) setRating(ratingRes.data.data); } catch {}
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
    } catch (err) { toast.error("Failed to update appointment status"); }
    finally { setActionLoading(false); }
  };

  const handleVerifyPayment = async () => {
    setActionLoading(true);
    try { const res = await verifyPayment(payment._id); setPayment(res.data.data); toast.success("Payment verified"); }
    catch { toast.error("Payment verification failed"); }
    finally { setActionLoading(false); }
  };

  const handleFailPayment = async () => {
    setActionLoading(true);
    try { const res = await failPayment(payment._id); setPayment(res.data.data); }
    catch { toast.error("Failed to update payment"); }
    finally { setActionLoading(false); }
  };

  const handleDownloadReceipt = async () => {
    if (!payment?._id) return;
    try {
      const res = await downloadReceipt(payment._id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a"); a.href = url; a.download = `receipt-${payment.transactionRef || payment._id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error("Failed to download receipt"); }
  };

  if (loading) return <LoadingSpinner />;
  if (!appointment) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Appointment not found</div>;

  const { patient, doctor, date, time, consultationType, symptoms, notes, status, priority, rescheduleHistory } = appointment;
  const isDoctor = currentUserRole === "doctor";
  const isPatient = currentUserRole === "patient";
  const TypeIcon = TYPE_ICON[consultationType] || Video;
  const doctorName = displayName(doctor);
  const patientName = displayName(patient);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <Link to="/appointments" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-[#0d9488] dark:hover:text-teal-400 transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={priority} />
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Status progress */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Appointment Details</h1>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">ID: {id.slice(-8)}</span>
        </div>
        <StatusProgress status={status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Doctor & Patient cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Doctor card */}
            <div className="glass-card rounded-2xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Doctor</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0d9488] to-[#06b6d4] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                  {getInitials(doctorName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Dr. {doctorName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{doctor?.specialization || "General"}</p>
                </div>
              </div>
            </div>

            {/* Patient card */}
            <div className="glass-card rounded-2xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Patient</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                  {getInitials(patientName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{patientName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{patient?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment info */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Consultation Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                  <Calendar className="w-4 h-4 text-[#0d9488]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{formatDate(date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Time</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{time}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/30">
                  <TypeIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{TYPE_LABEL[consultationType] || consultationType}</p>
                </div>
              </div>
            </div>

            {symptoms && (
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-[#0d9488]" />
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Symptoms</p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{symptoms}</p>
              </div>
            )}

            {notes && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0d9488]" />
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Notes</p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{notes}</p>
              </div>
            )}
          </div>

          {/* Reschedule history */}
          {rescheduleHistory?.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Reschedule History</h3>
              <div className="space-y-2.5">
                {rescheduleHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatDate(h.previousDate)} at {h.previousTime}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                        changed {new Date(h.rescheduledAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {isDoctor && status === "pending" && (
                <button onClick={() => handleStatusChange("confirmed")} disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0d9488] text-white text-sm rounded-xl hover:bg-[#0b7c72] active:scale-[0.98] disabled:opacity-50 transition shadow-sm">
                  <CheckCircle className="w-4 h-4" /> Confirm
                </button>
              )}
              {isDoctor && status === "confirmed" && (
                <button onClick={() => handleStatusChange("completed")} disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 transition shadow-sm">
                  <CheckCircle className="w-4 h-4" /> Complete
                </button>
              )}
              {/* Chat is now a floating widget — see ChatFab below */}
              {status === "confirmed" && (
                <button onClick={() => setShowReschedule(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm rounded-xl hover:bg-amber-600 active:scale-[0.98] transition shadow-sm">
                  <RefreshCw className="w-4 h-4" /> Reschedule
                </button>
              )}
              {status === "completed" && isPatient && !rating && (
                <button onClick={() => setShowRating(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm rounded-xl hover:bg-amber-600 active:scale-[0.98] transition shadow-sm">
                  <Star className="w-4 h-4" /> Rate
                </button>
              )}
            </div>

            {/* Rating display */}
            {rating && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-500/20">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= rating.rating ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-600"}`} />
                  ))}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{rating.rating}/5</span>
                </div>
                {rating.review && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rating.review}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Payment card */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                <CreditCard className="w-4 h-4 text-[#0d9488]" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Payment</h3>
            </div>

            {payment ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">LKR {payment.amount?.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    payment.status === "verified" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" :
                    payment.status === "failed" ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300" :
                    "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                  }`}>{payment.status}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Method</span>
                    <span className="capitalize text-gray-700 dark:text-gray-300">{payment.method}</span>
                  </div>
                  {payment.transactionRef && (
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Ref</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">{payment.transactionRef}</span>
                    </div>
                  )}
                  {payment.verifiedAt && (
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Verified</span>
                      <span className="text-gray-700 dark:text-gray-300">{new Date(payment.verifiedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {payment.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleVerifyPayment} disabled={actionLoading}
                      className="flex-1 py-2 bg-emerald-600 text-white text-xs rounded-xl hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 transition shadow-sm">
                      Verify
                    </button>
                    <button onClick={handleFailPayment} disabled={actionLoading}
                      className="flex-1 py-2 bg-red-600 text-white text-xs rounded-xl hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 transition shadow-sm">
                      Fail
                    </button>
                  </div>
                )}

                {payment.status === "verified" && (
                  <button onClick={handleDownloadReceipt}
                    className="w-full py-2 mt-1 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition flex items-center justify-center gap-1.5 ring-1 ring-gray-200 dark:ring-white/10">
                    <Download className="w-3.5 h-3.5" /> Download Receipt
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">No payment created yet.</p>
                <Link to={`/appointments/${id}/payment`}
                  className="block w-full py-2.5 bg-[#0d9488] text-white text-sm text-center rounded-xl hover:bg-[#0b7c72] active:scale-[0.98] transition shadow-sm">
                  Pay LKR 3,500.00
                </Link>
              </div>
            )}
          </div>

          {/* Quick info sidebar card */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Summary</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Calendar className="w-3.5 h-3.5 text-[#0d9488]" />
                <span>{formatDate(date)} at {time}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <TypeIcon className="w-3.5 h-3.5 text-[#0d9488]" />
                <span>{TYPE_LABEL[consultationType] || consultationType}</span>
              </div>
              {priority && (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#0d9488]" />
                  <span className="capitalize">{priority} priority</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReschedule && (
        <RescheduleModal appointment={appointment} isOpen={showReschedule}
          onClose={() => setShowReschedule(false)}
          onRescheduled={(updated) => { setAppointment(updated); setShowReschedule(false); toast.success("Appointment rescheduled"); }} />
      )}

      {showRating && (
        <RatingModal appointmentId={id} existingRating={rating} isOpen={showRating}
          onClose={() => setShowRating(false)}
          onRated={(newRating) => setRating(newRating)} />
      )}

      <ChatFab appointmentId={id} status={status} doctorName={doctorName} />
    </div>
  );
}
