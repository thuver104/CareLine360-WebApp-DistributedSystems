const appointmentService = require("../services/appointmentService");

const createAppointment = async (req, res, next) => {
  try {
    req.body.patient = req.user.userId;
    const appointment = await appointmentService.createAppointment(req.body);
    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

const getAppointments = async (req, res, next) => {
  try {
    const result = await appointmentService.getAppointments(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.updateAppointment(req.params.id, req.body);
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

const deleteAppointment = async (req, res, next) => {
  try {
    const result = await appointmentService.deleteAppointment(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const transitionStatus = async (req, res, next) => {
  try {
    const appointment = await appointmentService.transitionStatus(req.params.id, req.body.status);
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

const rescheduleAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.rescheduleAppointment(
      req.params.id,
      req.body.date,
      req.body.time
    );
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.cancelAppointment(req.params.id, req.body.reason);
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  transitionStatus,
  rescheduleAppointment,
  cancelAppointment,
};
