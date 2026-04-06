/**
 * Profile Strength Service
 * Calculates patient profile completion percentage
 */

const hasText = (v) => typeof v === 'string' && v.trim().length > 0;
const hasNum = (v) => typeof v === 'number' && !Number.isNaN(v);
const hasArray = (v) => Array.isArray(v) && v.length > 0;

/**
 * Calculate patient profile strength
 * Returns score (0-100), breakdown, and missing items
 */
const calcPatientProfileStrength = ({ patient, docsCount = 0 }) => {
  // ===== 30% Basic Info =====
  const addressOk =
    hasText(patient?.address?.district) &&
    hasText(patient?.address?.city) &&
    hasText(patient?.address?.line1);

  const basicOk =
    hasText(patient?.fullName) &&
    !!patient?.dob &&
    hasText(patient?.gender) &&
    addressOk;

  // ===== 30% Emergency Contact =====
  const emergencyOk =
    hasText(patient?.emergencyContact?.name) &&
    hasText(patient?.emergencyContact?.phone) &&
    hasText(patient?.emergencyContact?.relationship);

  // ===== 20% Medical Info =====
  const medicalOk =
    hasText(patient?.bloodGroup) &&
    (hasArray(patient?.allergies) || hasArray(patient?.chronicConditions));

  // ===== 20% Documents =====
  const docsOk = docsCount >= 1;

  // Calculate breakdown
  const breakdown = {
    basicInfo: basicOk ? 30 : 0,
    emergencyContact: emergencyOk ? 30 : 0,
    medicalInfo: medicalOk ? 20 : 0,
    documents: docsOk ? 20 : 0
  };

  const score =
    breakdown.basicInfo +
    breakdown.emergencyContact +
    breakdown.medicalInfo +
    breakdown.documents;

  // Build missing items list
  const missing = [];

  if (!basicOk) {
    const missingBasic = [];
    if (!hasText(patient?.fullName)) missingBasic.push('full name');
    if (!patient?.dob) missingBasic.push('date of birth');
    if (!hasText(patient?.gender)) missingBasic.push('gender');
    if (!addressOk) missingBasic.push('complete address');
    missing.push(`Complete basic info: ${missingBasic.join(', ')}`);
  }

  if (!emergencyOk) {
    const missingEmergency = [];
    if (!hasText(patient?.emergencyContact?.name)) missingEmergency.push('name');
    if (!hasText(patient?.emergencyContact?.phone)) missingEmergency.push('phone');
    if (!hasText(patient?.emergencyContact?.relationship)) missingEmergency.push('relationship');
    missing.push(`Add emergency contact: ${missingEmergency.join(', ')}`);
  }

  if (!medicalOk) {
    missing.push('Add medical info: blood group + allergies or chronic conditions');
  }

  if (!docsOk) {
    missing.push('Upload at least 1 document (ID, prescription, or medical report)');
  }

  // Detailed breakdown for frontend
  const details = {
    basicInfo: {
      complete: basicOk,
      items: {
        fullName: hasText(patient?.fullName),
        dob: !!patient?.dob,
        gender: hasText(patient?.gender),
        address: addressOk
      }
    },
    emergencyContact: {
      complete: emergencyOk,
      items: {
        name: hasText(patient?.emergencyContact?.name),
        phone: hasText(patient?.emergencyContact?.phone),
        relationship: hasText(patient?.emergencyContact?.relationship)
      }
    },
    medicalInfo: {
      complete: medicalOk,
      items: {
        bloodGroup: hasText(patient?.bloodGroup),
        allergiesOrConditions: hasArray(patient?.allergies) || hasArray(patient?.chronicConditions)
      }
    },
    documents: {
      complete: docsOk,
      count: docsCount
    }
  };

  return {
    score,
    breakdown,
    missing,
    details,
    docsCount,
    isComplete: score >= 80
  };
};

module.exports = { calcPatientProfileStrength };
