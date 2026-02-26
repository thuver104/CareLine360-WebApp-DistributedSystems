const { validationResult } = require("express-validator");
const doctorService = require("../services/doctorService");

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
};

// ─── Profile ──────────────────────────────────────────────────────────────────

const createProfile = async (req, res) => {
  if (!handleValidation(req, res)) return;
  const result = await doctorService.createDoctorProfile({
    userId: req.user.userId,
    ...req.body,
  });
  res.status(result.status).json(result.data);
};

const getProfile = async (req, res) => {
  const result = await doctorService.getDoctorProfile({
    userId: req.user.userId,
  });
  res.status(result.status).json(result.data);
};

const updateProfile = async (req, res) => {
  const result = await doctorService.updateDoctorProfile({
    userId: req.user.userId,
    updates: req.body,
  });
  res.status(result.status).json(result.data);
};

/**
 * PUT /api/doctor/profile/avatar
 * Body: { image: "data:image/jpeg;base64,..." }
 * No Multer needed — pure base64 via JSON body.
 */
const updateAvatar = async (req, res) => {
  const { image } = req.body;
  if (!image)
    return res
      .status(400)
      .json({ message: "image (base64) is required in request body" });

  const result = await doctorService.updateAvatarBase64({
    userId: req.user.userId,
    base64Image: image,
  });
  res.status(result.status).json(result.data);
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const getDashboard = async (req, res) => {
  const result = await doctorService.getDashboardStats({
    userId: req.user.userId,
  });
  res.status(result.status).json(result.data);
};

const getAnalytics = async (req, res) => {
  const result = await doctorService.getDoctorAnalytics({
    userId: req.user.userId,
  });
  res.status(result.status).json(result.data);
};

// ─── Availability ─────────────────────────────────────────────────────────────

const getAvailability = async (req, res) => {
  const result = await doctorService.getAvailability({
    userId: req.user.userId,
  });
  res.status(result.status).json(result.data);
};

const addSlots = async (req, res) => {
  if (!handleValidation(req, res)) return;
  const { slots } = req.body;
  if (!Array.isArray(slots) || slots.length === 0)
    return res.status(400).json({ message: "slots must be a non-empty array" });
  const result = await doctorService.addAvailabilitySlots({
    userId: req.user.userId,
    slots,
  });
  res.status(result.status).json(result.data);
};

const deleteSlot = async (req, res) => {
  const result = await doctorService.deleteAvailabilitySlot({
    userId: req.user.userId,
    slotId: req.params.slotId,
  });
  res.status(result.status).json(result.data);
};

const updateSlot = async (req, res) => {
  const { startTime, endTime } = req.body;
  const result = await doctorService.updateAvailabilitySlot({
    userId: req.user.userId,
    slotId: req.params.slotId,
    startTime,
    endTime,
  });
  res.status(result.status).json(result.data);
};

// ─── Appointments ─────────────────────────────────────────────────────────────

const getAppointments = async (req, res) => {
  const { status, date, dateFrom, dateTo, search, page, limit } = req.query;
  const result = await doctorService.getMyAppointments({
    userId: req.user.userId,
    status,
    date,
    dateFrom,
    dateTo,
    search,
    page,
    limit,
  });
  res.status(result.status).json(result.data);
};

const updateAppointment = async (req, res) => {
  const result = await doctorService.updateAppointmentStatus({
    userId: req.user.userId,
    appointmentId: req.params.appointmentId,
    status: req.body.status,
    notes: req.body.notes,
  });
  res.status(result.status).json(result.data);
};

const deleteAppointment = async (req, res) => {
  const result = await doctorService.deleteAppointment({
    userId: req.user.userId,
    appointmentId: req.params.appointmentId,
  });
  res.status(result.status).json(result.data);
};

// ─── Patients ─────────────────────────────────────────────────────────────────

const getPatients = async (req, res) => {
  const result = await doctorService.getMyPatients({
    userId: req.user.userId,
    ...req.query,
  });
  res.status(result.status).json(result.data);
};

const getPatientDetail = async (req, res) => {
  const result = await doctorService.getPatientDetail({
    userId: req.user.userId,
    patientDbId: req.params.patientId,
  });
  res.status(result.status).json(result.data);
};

// ─── Medical Records ──────────────────────────────────────────────────────────

const createRecord = async (req, res) => {
  const result = await doctorService.createMedicalRecord({
    userId: req.user.userId,
    data: req.body,
  });
  res.status(result.status).json(result.data);
};

const getRecordsByPatient = async (req, res) => {
  const result = await doctorService.getMedicalRecordsByPatient({
    userId: req.user.userId,
    patientId: req.params.patientId,
    ...req.query,
  });
  res.status(result.status).json(result.data);
};

const updateRecord = async (req, res) => {
  const result = await doctorService.updateMedicalRecord({
    userId: req.user.userId,
    recordId: req.params.recordId,
    updates: req.body,
  });
  res.status(result.status).json(result.data);
};

// ─── Prescriptions ────────────────────────────────────────────────────────────

const savePrescription = async (req, res) => {
  const result = await doctorService.savePrescription({
    userId: req.user.userId,
    data: req.body,
  });
  res.status(result.status).json(result.data);
};

const getPrescriptions = async (req, res) => {
  const result = await doctorService.getMyPrescriptions({
    userId: req.user.userId,
    ...req.query,
  });
  res.status(result.status).json(result.data);
};

// Proxy Cloudinary PDF to the browser as a forced download.
// Using the backend avoids CORS / Content-Disposition:inline issues.
const downloadPrescription = async (req, res) => {
  const { url, filename = "prescription.pdf" } = req.query;
  if (!url) return res.status(400).json({ message: "url is required" });

  // Only allow Cloudinary URLs for security
  try {
    const p = new URL(url);
    if (!p.hostname.endsWith("cloudinary.com")) {
      return res.status(403).json({ message: "URL not allowed" });
    }
  } catch {
    return res.status(400).json({ message: "Invalid URL" });
  }

  const https = require("https");
  const http = require("http");

  // Recursive helper so we follow 301/302/307 redirects from Cloudinary
  const fetchAndStream = (targetUrl, redirectsLeft = 5) => {
    const parsed = new URL(targetUrl);
    const lib = parsed.protocol === "https:" ? https : http;

    lib
      .get(targetUrl, (upstream) => {
        // Follow redirects
        if ([301, 302, 303, 307, 308].includes(upstream.statusCode)) {
          upstream.resume(); // discard body
          if (redirectsLeft <= 0) {
            return res.status(502).json({ message: "Too many redirects" });
          }
          const location = upstream.headers.location;
          if (!location) {
            return res
              .status(502)
              .json({ message: "Redirect missing location header" });
          }
          return fetchAndStream(
            new URL(location, targetUrl).href,
            redirectsLeft - 1,
          );
        }

        if (upstream.statusCode !== 200) {
          return res
            .status(502)
            .json({ message: `Upstream error: ${upstream.statusCode}` });
        }

        const safeFilename = filename.replace(/[^\w.\-]/g, "_");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${safeFilename}"`,
        );
        if (upstream.headers["content-length"]) {
          res.setHeader("Content-Length", upstream.headers["content-length"]);
        }
        upstream.pipe(res);
      })
      .on("error", () => {
        if (!res.headersSent) {
          res
            .status(502)
            .json({ message: "Failed to fetch file from Cloudinary" });
        }
      });
  };

  fetchAndStream(url);
};

// ─── Ratings ──────────────────────────────────────────────────────────────────

const getRatings = async (req, res) => {
  const result = await doctorService.getMyRatings({
    userId: req.user.userId,
    ...req.query,
  });
  res.status(result.status).json(result.data);
};

// ─── Public ───────────────────────────────────────────────────────────────────

const listDoctors = async (req, res) => {
  const result = await doctorService.getPublicDoctors(req.query);
  res.status(result.status).json(result.data);
};

// ─── Account deactivation ─────────────────────────────────────────────────────

/**
 * DELETE /api/doctor/account
 * Soft-deletes the doctor profile and deactivates the User account.
 * Medical records and appointments are preserved.
 */
const deactivateAccount = async (req, res) => {
  const result = await doctorService.deactivateDoctorAccount({
    userId: req.user.userId,
  });
  res.status(result.status).json(result.data);
};

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  updateAvatar,
  getDashboard,
  getAnalytics,
  getAvailability,
  addSlots,
  deleteSlot,
  updateSlot,
  getAppointments,
  updateAppointment,
  deleteAppointment,
  getPatients,
  getPatientDetail,
  createRecord,
  getRecordsByPatient,
  updateRecord,
  savePrescription,
  getPrescriptions,
  downloadPrescription,
  getRatings,
  listDoctors,
  deactivateAccount,
};
