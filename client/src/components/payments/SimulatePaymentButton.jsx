import { useState } from "react";
import { createPayment, verifyPayment, failPayment } from "../../api/paymentApi";

export default function SimulatePaymentButton({ appointmentId, patientId, onPaymentUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await createPayment({
        appointment: appointmentId,
        patient: patientId,
        amount: 50,
        method: "card",
      });
      onPaymentUpdate(res.data.data);
    } catch (err) {
      console.error("Create payment error:", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId) => {
    setLoading(true);
    try {
      const res = await verifyPayment(paymentId);
      onPaymentUpdate(res.data.data);
    } catch (err) {
      console.error("Verify error:", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFail = async (paymentId) => {
    setLoading(true);
    try {
      const res = await failPayment(paymentId);
      onPaymentUpdate(res.data.data);
    } catch (err) {
      console.error("Fail error:", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return { handleCreate, handleVerify, handleFail, loading };
}
