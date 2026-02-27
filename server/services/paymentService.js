const Payment = require("../models/Payment");
const crypto = require("crypto");

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

module.exports = {
  createPayment,
  getPaymentById,
  getPaymentByAppointment,
  verifyPayment,
  failPayment,
};
