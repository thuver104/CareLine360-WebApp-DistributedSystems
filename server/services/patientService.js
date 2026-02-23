const Patient = require("../models/Patient");
const User = require("../models/User");

// If you store docs in another collection, import it here later:
// const Document = require("../models/Document");

const hasValue = (v) => {
  if (Array.isArray(v)) return v.length > 0;
  return v !== undefined && v !== null && String(v).trim() !== "";
};

const calcProfileStrength = async (patient) => {
  // 30% Basic Info
  const basicOk =
    hasValue(patient.fullName) &&
    hasValue(patient.dob) &&
    hasValue(patient.gender) &&
    hasValue(patient.address?.line1) &&
    hasValue(patient.address?.city);

  // 30% Emergency Contact
  const emergencyOk =
    hasValue(patient.emergencyContact?.name) &&
    hasValue(patient.emergencyContact?.phone) &&
    hasValue(patient.emergencyContact?.relationship);

  // 20% Medical Info
  const medicalOk =
    hasValue(patient.bloodGroup) &&
    (hasValue(patient.allergies) || hasValue(patient.chronicConditions));

  // 20% Document upload
  // ✅ For now, you said doc upload exists/coming. If you already store docs:
  // const docsCount = await Document.countDocuments({ userId: patient.userId, isDeleted:false });
  // const docsOk = docsCount >= 1;

  // Temporary: if you don’t have document module yet, keep it false
  const docsCount = patient.documentsCount || 0; // optional field if you store count
  const docsOk = docsCount >= 1;

  const breakdown = {
    basicInfo: basicOk ? 30 : 0,
    emergencyContact: emergencyOk ? 30 : 0,
    medicalInfo: medicalOk ? 20 : 0,
    documents: docsOk ? 20 : 0,
  };

  const score =
    breakdown.basicInfo + breakdown.emergencyContact + breakdown.medicalInfo + breakdown.documents;

  const missing = [];
  if (!basicOk) missing.push("Complete basic info (DOB, gender, address)");
  if (!emergencyOk) missing.push("Add emergency contact details");
  if (!medicalOk) missing.push("Add medical info (blood group + allergies/conditions)");
  if (!docsOk) missing.push("Upload at least 1 document");

  return { score, breakdown, missing, docsCount };
};

const makePatientId = () => "P" + Date.now();

const getMyPatientProfile = async (userId) => {
  let patient = await Patient.findOne({
    userId,
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  });

  if (!patient) {
    const user = await User.findById(userId).select("name email");
    if (!user) return null;

    patient = await Patient.create({
      userId,
      patientId: makePatientId(),
      fullName: user.name || "Patient",
      isDeleted: false,
    });
  }

  const profileStrength = await calcProfileStrength(patient);
  return { patient, profileStrength };
};

module.exports = { getMyPatientProfile, calcProfileStrength };
