/**
 * Middleware: requireDoctorProfile
 *
 * For doctor-only routes that require a completed profile (e.g., dashboard).
 * If the doctor hasn't created their profile yet, returns 403 with a special
 * code so the frontend can redirect to the profile setup page.
 */
const Doctor = require("../models/Doctor");

const requireDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.userId, isDeleted: false });
    if (!doctor) {
      return res.status(403).json({
        code: "PROFILE_INCOMPLETE",
        message: "Please complete your doctor profile to continue.",
      });
    }
    req.doctor = doctor;
    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error checking doctor profile" });
  }
};

module.exports = { requireDoctorProfile };