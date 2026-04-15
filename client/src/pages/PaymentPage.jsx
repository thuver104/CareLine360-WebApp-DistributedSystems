import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { CreditCard, Lock, CheckCircle, Download } from "lucide-react";
import { getAppointmentById } from "../api/appointmentApi";
import { getPaymentByAppointment, createPayment, verifyPayment, downloadReceipt } from "../api/paymentApi";
import PaymentSummary from "../components/payments/PaymentSummary";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import { displayName } from "../utils/displayName";

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

export default function PaymentPage() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState({});

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

  const validate = () => {
    const errs = {};
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length !== 16) errs.cardNumber = "Card number must be 16 digits";
    if (!cardholderName.trim()) errs.cardholderName = "Cardholder name is required";
    const expParts = expiry.split("/");
    if (expParts.length !== 2 || expParts[0].length !== 2 || expParts[1].length !== 2) {
      errs.expiry = "Use MM/YY format";
    } else {
      const month = parseInt(expParts[0], 10);
      if (month < 1 || month > 12) errs.expiry = "Invalid month";
    }
    if (cvv.length !== 3) errs.cvv = "CVV must be 3 digits";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    setProcessing(true);
    try {
      const createRes = await createPayment({
        appointment: id,
        patient: appointment.patient._id,
        amount: 3500,
        currency: "LKR",
        method: "card",
      });
      const created = createRes.data.data;

      const verifyRes = await verifyPayment(created._id);
      setPayment(verifyRes.data.data);
      setSuccess(true);
      toast.success("Payment completed successfully");
    } catch (err) {
      toast.error("Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!appointment) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Appointment not found</div>;

  // Payment already exists — show summary
  if (payment && !success) {
    return (
      <div className="max-w-md mx-auto py-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Payment</h1>
        <PaymentSummary payment={payment} />
        <Link
          to={`/appointments/${id}`}
          className="block text-center mt-4 text-sm text-[#0d9488] dark:text-teal-400 hover:text-[#0b7c72] dark:hover:text-teal-300 transition"
        >
          View Appointment
        </Link>
      </div>
    );
  }

  // Success state after paying
  if (success) {
    return (
      <div className="max-w-md mx-auto py-8 text-center animate-fade-in">
        <div className="glass-card rounded-2xl p-8">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Payment Successful</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Your consultation fee has been processed.</p>
          {payment?.transactionRef && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
              Transaction Ref: <span className="font-mono">{payment.transactionRef}</span>
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <Link
              to={`/appointments/${id}`}
              className="inline-block px-6 py-2.5 bg-[#0d9488] text-white text-sm rounded-xl hover:bg-[#0b7c72] active:scale-[0.98] transition shadow-sm"
            >
              View Appointment
            </Link>
            {payment?.status === "verified" && (
              <button
                onClick={async () => {
                  try {
                    const res = await downloadReceipt(payment._id);
                    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `receipt-${payment.transactionRef || payment._id}.pdf`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  } catch {
                    toast.error("Failed to download receipt");
                  }
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] transition"
              >
                <Download className="w-4 h-4" /> Receipt
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const inputClass = (field) => {
    const base =
      "w-full h-11 rounded-xl border bg-gray-50 dark:bg-white/5 px-3 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 " +
      "focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition shadow-sm";
    return errors[field]
      ? base + " border-red-300 dark:border-red-500/50"
      : base + " border-gray-200 dark:border-white/10";
  };

  // Fillable credit card form
  return (
    <div className="max-w-lg mx-auto py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Complete Payment</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Consultation with <span className="font-medium text-gray-700 dark:text-gray-300">{displayName(appointment.doctor)}</span>
      </p>

      {/* Card Preview */}
      <div className="relative h-48 rounded-2xl bg-gradient-to-br from-[#0d9488] via-[#0891b2] to-[#06b6d4] p-6 mb-6 shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex flex-col justify-between h-full text-white">
          <div className="flex justify-between items-start">
            <CreditCard className="w-10 h-10 opacity-80" />
            <Lock className="w-4 h-4 opacity-60" />
          </div>
          <div>
            <p className="text-lg font-mono tracking-[0.2em] mb-3">
              {cardNumber || "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022"}
            </p>
            <div className="flex justify-between items-end">
              <p className="text-sm font-medium uppercase tracking-wide opacity-90">
                {cardholderName || "YOUR NAME"}
              </p>
              <p className="text-sm font-mono opacity-80">
                {expiry || "MM/YY"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm text-gray-600 dark:text-gray-400">Amount Due</span>
          <span className="text-2xl font-bold text-gray-800 dark:text-white">LKR 3,500.00</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cardholder Name</label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
              placeholder="John Doe"
              className={inputClass("cardholderName")}
            />
            {errors.cardholderName && <p className="text-xs text-red-500 mt-1">{errors.cardholderName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className={inputClass("cardNumber")}
            />
            {errors.cardNumber && <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                className={inputClass("expiry")}
              />
              {errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVV</label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="123"
                maxLength={3}
                className={inputClass("cvv")}
              />
              {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
            </div>
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full mt-6 py-3 bg-[#0d9488] text-white font-medium rounded-xl hover:bg-[#0b7c72] active:scale-[0.98] disabled:opacity-50 transition shadow-sm"
        >
          {processing ? "Processing..." : "Pay LKR 3,500.00"}
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          Secure payment — simulated for demonstration purposes.
        </p>
      </div>

      <Link
        to={`/appointments/${id}`}
        className="block text-center mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-[#0d9488] dark:hover:text-teal-400 transition"
      >
        Skip for now
      </Link>
    </div>
  );
}
