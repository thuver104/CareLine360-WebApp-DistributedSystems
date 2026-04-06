/**
 * Calculate doctor profile strength (0-100)
 * 
 * Scoring breakdown:
 * - 25% Basic info (fullName, specialization, qualifications)
 * - 25% Professional credentials (licenseNumber, licenseDocUrl, experience)
 * - 25% Availability (has ≥1 slot)
 * - 25% Pricing & Bio (consultationFee > 0, bio text)
 */

const hasText = (v) => typeof v === 'string' && v.trim().length > 0;
const hasNum = (v) => typeof v === 'number' && !Number.isNaN(v) && v > 0;
const hasArray = (v) => Array.isArray(v) && v.length > 0;

const calcDoctorProfileStrength = ({ doctor }) => {
  if (!doctor) {
    return { score: 0, breakdown: {}, missing: ['Doctor profile not found'] };
  }

  // 25% Basic info
  const basicOk = 
    hasText(doctor.fullName) &&
    hasText(doctor.specialization) &&
    hasArray(doctor.qualifications);

  // 25% Professional credentials
  const credentialsOk =
    hasText(doctor.licenseNumber) &&
    hasNum(doctor.experience);

  // 25% Availability
  const availabilityOk = 
    hasArray(doctor.availabilitySlots) &&
    doctor.availabilitySlots.some(s => !s.isBooked);

  // 25% Pricing & Bio
  const pricingOk =
    hasNum(doctor.consultationFee) &&
    hasText(doctor.bio) &&
    doctor.bio.length >= 50;

  const breakdown = {
    basicInfo: basicOk ? 25 : 0,
    credentials: credentialsOk ? 25 : 0,
    availability: availabilityOk ? 25 : 0,
    pricingAndBio: pricingOk ? 25 : 0,
  };

  const score = 
    breakdown.basicInfo + 
    breakdown.credentials + 
    breakdown.availability + 
    breakdown.pricingAndBio;

  const missing = [];
  if (!basicOk) {
    if (!hasText(doctor.fullName)) missing.push('Add your full name');
    if (!hasText(doctor.specialization)) missing.push('Add your specialization');
    if (!hasArray(doctor.qualifications)) missing.push('Add your qualifications (MBBS, MD, etc.)');
  }
  if (!credentialsOk) {
    if (!hasText(doctor.licenseNumber)) missing.push('Add your medical license number');
    if (!hasNum(doctor.experience)) missing.push('Add years of experience');
  }
  if (!availabilityOk) {
    missing.push('Add availability slots for appointments');
  }
  if (!pricingOk) {
    if (!hasNum(doctor.consultationFee)) missing.push('Set your consultation fee');
    if (!hasText(doctor.bio) || doctor.bio.length < 50) missing.push('Write a bio (at least 50 characters)');
  }

  return { score, breakdown, missing };
};

module.exports = { calcDoctorProfileStrength };
