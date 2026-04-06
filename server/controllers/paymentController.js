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

const createCheckoutSession = async (req, res, next) => {
  try {
    const result = await paymentService.createCheckoutSession(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const gatewayNotify = async (req, res, next) => {
  try {
    const orderId = req.body.order_id;
    const statusCode = req.body.status_code;
    const gatewayPaymentId = req.body.payment_id;

    const payment = await paymentService.processGatewayNotification({
      orderId,
      statusCode,
      gatewayPaymentId,
    });

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
  createCheckoutSession,
  gatewayNotify,
};
