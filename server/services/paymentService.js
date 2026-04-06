const Payment = require("../models/Payment");
const crypto = require("crypto");

const generatePayHereHash = ({ merchantId, orderId, amount, currency, merchantSecret }) => {
  const secretHash = crypto.createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
  const payload = `${merchantId}${orderId}${amount}${currency}${secretHash}`;
  return crypto.createHash("md5").update(payload).digest("hex").toUpperCase();
};

const createPayment = async (data) => {
  const existing = await Payment.findOne({ appointment: data.appointment });
  if (existing) {
    const error = new Error("Payment already exists for this appointment");
    error.statusCode = 409;
    throw error;
  }

  const payment = await Payment.create(data);
  return payment.populate("appointment patient");
};

const getPaymentById = async (id) => {
  const payment = await Payment.findById(id).populate("appointment patient");
  if (!payment) {
    const error = new Error("Payment not found");
    error.statusCode = 404;
    throw error;
  }
  return payment;
};

const getPaymentByAppointment = async (appointmentId) => {
  const payment = await Payment.findOne({ appointment: appointmentId }).populate("appointment patient");
  if (!payment) {
    const error = new Error("Payment not found for this appointment");
    error.statusCode = 404;
    throw error;
  }
  return payment;
};

const verifyPayment = async (id) => {
  const payment = await Payment.findById(id);
  if (!payment) {
    const error = new Error("Payment not found");
    error.statusCode = 404;
    throw error;
  }

  if (payment.status !== "pending") {
    const error = new Error("Payment is not in pending status");
    error.statusCode = 400;
    throw error;
  }

  payment.status = "verified";
  payment.verifiedAt = new Date();
  payment.transactionRef = `TXN-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
  await payment.save();
  return payment.populate("appointment patient");
};

const failPayment = async (id) => {
  const payment = await Payment.findById(id);
  if (!payment) {
    const error = new Error("Payment not found");
    error.statusCode = 404;
    throw error;
  }

  if (payment.status !== "pending") {
    const error = new Error("Payment is not in pending status");
    error.statusCode = 400;
    throw error;
  }

  payment.status = "failed";
  await payment.save();
  return payment.populate("appointment patient");
};

const createCheckoutSession = async ({ appointment, patient, amount, currency = "LKR", method = "payhere" }) => {
  const existing = await Payment.findOne({ appointment });
  if (existing) {
    return {
      payment: await existing.populate("appointment patient"),
      alreadyExists: true,
      mode: process.env.PAYMENT_GATEWAY_MODE || "sandbox",
    };
  }

  const payment = await Payment.create({
    appointment,
    patient,
    amount,
    currency,
    method,
    status: "pending",
  });

  const mode = process.env.PAYMENT_GATEWAY_MODE || "sandbox";
  const orderId = payment._id.toString();

  if (mode !== "payhere") {
    return {
      payment: await payment.populate("appointment patient"),
      mode: "sandbox",
      checkoutUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/payments/${appointment}`,
      fields: {
        sandbox: true,
        order_id: orderId,
        amount,
        currency,
      },
    };
  }

  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

  if (!merchantId || !merchantSecret) {
    const error = new Error("PAYHERE_MERCHANT_ID or PAYHERE_MERCHANT_SECRET is missing");
    error.statusCode = 500;
    throw error;
  }

  const normalizedAmount = Number(amount).toFixed(2);
  const hash = generatePayHereHash({
    merchantId,
    orderId,
    amount: normalizedAmount,
    currency,
    merchantSecret,
  });

  return {
    payment: await payment.populate("appointment patient"),
    mode: "payhere",
    checkoutUrl: "https://sandbox.payhere.lk/pay/checkout",
    fields: {
      merchant_id: merchantId,
      return_url: process.env.PAYHERE_RETURN_URL || `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/success`,
      cancel_url: process.env.PAYHERE_CANCEL_URL || `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/cancel`,
      notify_url: process.env.PAYHERE_NOTIFY_URL || "",
      order_id: orderId,
      items: "CareLine360 Consultation Fee",
      currency,
      amount: normalizedAmount,
      first_name: "CareLine360",
      last_name: "Patient",
      email: "noreply@careline360.lk",
      phone: "0700000000",
      address: "N/A",
      city: "Colombo",
      country: "Sri Lanka",
      hash,
    },
  };
};

const processGatewayNotification = async ({ orderId, statusCode, gatewayPaymentId }) => {
  const payment = await Payment.findById(orderId);
  if (!payment) {
    const error = new Error("Payment not found for notification");
    error.statusCode = 404;
    throw error;
  }

  if (String(statusCode) === "2") {
    payment.status = "verified";
    payment.verifiedAt = new Date();
    payment.transactionRef = gatewayPaymentId || payment.transactionRef || `TXN-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
  } else if (["-1", "0", "-2", "-3"].includes(String(statusCode))) {
    payment.status = "failed";
  }

  await payment.save();
  return payment.populate("appointment patient");
};

module.exports = {
  createPayment,
  getPaymentById,
  getPaymentByAppointment,
  verifyPayment,
  failPayment,
  createCheckoutSession,
  processGatewayNotification,
};
