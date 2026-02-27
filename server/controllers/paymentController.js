const paymentService = require("../services/paymentService");

const createPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.createPayment(req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const getPaymentByAppointment = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentByAppointment(req.params.appointmentId);
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.verifyPayment(req.params.id);
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const failPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.failPayment(req.params.id);
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getPaymentById,
  getPaymentByAppointment,
  verifyPayment,
  failPayment,
};
