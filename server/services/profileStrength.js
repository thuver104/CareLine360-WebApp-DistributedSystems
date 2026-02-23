const hasText = (v) => typeof v === "string" && v.trim().length > 0;
const hasNum = (v) => typeof v === "number" && !Number.isNaN(v);

const calcPatientProfileStrength = ({ patient, docsCount = 0 }) => {
  // ✅ 30% Basic info
  const addressOk =
    hasText(patient?.address?.district) &&
    hasText(patient?.address?.city) &&
    hasText(patient?.address?.line1);

  const basicOk =
    hasText(patient?.fullName) &&
    !!patient?.dob &&
    hasText(patient?.gender) &&
    addressOk;

  // ✅ 30% Emergency contact
  const emergencyOk =
    hasText(patient?.emergencyContact?.name) &&
    hasText(patient?.emergencyContact?.phone) &&
    hasText(patient?.emergencyContact?.relationship);

  // ✅ 20% Medical info
  const medicalOk =
    hasText(patient?.bloodGroup) &&
    ((Array.isArray(patient?.allergies) && patient.allergies.length > 0) ||
      (Array.isArray(patient?.chronicConditions) && patient.chronicConditions.length > 0));

  // ✅ 20% At least 1 document
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

  if (!basicOk) {
    missing.push("Complete basic info: DOB, gender, full address (district/city/line1)");
  }
  if (!emergencyOk) {
    missing.push("Add emergency contact: name, phone, relationship");
  }
  if (!medicalOk) {
    missing.push("Add medical info: blood group + allergies or chronic conditions");
  }
  if (!docsOk) {
    missing.push("Upload at least 1 document");
  }

  return { score, breakdown, missing, docsCount };
};

module.exports = { calcPatientProfileStrength };
