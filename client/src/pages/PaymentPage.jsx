import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getAppointmentById } from "../api/appointmentApi";
import { getPaymentByAppointment, createPayment, verifyPayment } from "../api/paymentApi";
import PaymentSummary from "../components/payments/PaymentSummary";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import { displayName } from "../utils/displayName";

export default function PaymentPage() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const handlePay = async () => {
    setProcessing(true);
    try {
      const createRes = await createPayment({
        appointment: id,
        patient: appointment.patient._id,
        amount: 50,
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
  if (!appointment) return <div className="text-center py-12 text-gray-500">Appointment not found</div>;

  // Payment already exists — show summary
  if (payment && !success) {
    return (
      <div className="max-w-md mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Payment</h1>
        <PaymentSummary payment={payment} />
        <Link
          to={`/appointments/${id}`}
          className="block text-center mt-4 text-sm text-blue-600 hover:text-blue-800"
        >
          View Appointment
        </Link>
      </div>
    );
  }

  // Success state after paying
  if (success) {
    return (
      <div className="max-w-md mx-auto py-8 text-center">
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Successful</h2>
          <p className="text-sm text-gray-500 mb-4">Your consultation fee has been processed.</p>
          {payment?.transactionRef && (
            <p className="text-xs text-gray-400 mb-6">
              Transaction Ref: <span className="font-mono">{payment.transactionRef}</span>
            </p>
          )}
          <Link
            to={`/appointments/${id}`}
            className="inline-block px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200"
          >
            View Appointment
          </Link>
        </div>
      </div>
    );
  }

  // Dummy credit card form
  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Complete Payment</h1>
      <p className="text-sm text-gray-500 mb-6">
        Consultation with <span className="font-medium">{displayName(appointment.doctor)}</span>
      </p>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm text-gray-600">Amount Due</span>
          <span className="text-2xl font-bold text-gray-800">$50.00</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            <input
              type="text"
              readOnly
              value="4242 4242 4242 4242"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
              <input
                type="text"
                readOnly
                value="12/28"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
              <input
                type="text"
                readOnly
                value="123"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full mt-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-200"
        >
          {processing ? "Processing..." : "Pay $50.00"}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          This is a simulated payment for demonstration purposes.
        </p>
      </div>

      <Link
        to={`/appointments/${id}`}
        className="block text-center mt-4 text-sm text-gray-500 hover:text-gray-700"
      >
        Skip for now
      </Link>
    </div>
  );
}
