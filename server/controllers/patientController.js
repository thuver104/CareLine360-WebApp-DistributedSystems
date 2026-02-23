const Patient = require("../models/Patient");
const User = require("../models/User");
const { calcPatientProfileStrength } = require("../services/profileStrength");

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const patient = await Patient.findOne({ userId ,  $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],});
    if (!patient) return res.status(404).json({ message: "Profile not found" });

    const user = await User.findById(userId).select("email isVerified role");
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Document count (for now no doc module => 0)
    const docsCount = 0;

    const profileStrength = calcPatientProfileStrength({ patient, docsCount });

    // optional: store latest score in DB
    if (patient.profileStrength !== profileStrength.score) {
      patient.profileStrength = profileStrength.score;
      await patient.save();
    }

    return res.json({
      fullName: patient.fullName,
      patientId: patient.patientId,
      email: user.email,
      isVerified: user.isVerified,
      role: user.role,

      avatarUrl: patient.avatarUrl,

      dob: patient.dob,
      gender: patient.gender,
      address: patient.address,
      nic: patient.nic,
      emergencyContact: patient.emergencyContact,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
      heightCm: patient.heightCm,
      weightKg: patient.weightKg,

      profileStrength, // ✅ includes score + breakdown + missing
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ---------------- VALIDATION ----------------
    const {
      dob,
      gender,
      nic,
      address,
      emergencyContact,
      heightCm,
      weightKg,
      bloodGroup,
      allergies,
      chronicConditions,
      fullName,
    } = req.body;

    // fullName basic check (optional)
    if (fullName !== undefined) {
      if (typeof fullName !== "string" || fullName.trim().length < 3) {
        return res.status(400).json({ message: "Full name must be at least 3 characters" });
      }
    }

    // DOB validation
    if (dob !== undefined && dob !== null && dob !== "") {
      const d = new Date(dob);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ message: "Invalid date of birth" });
      }
      if (d > new Date()) {
        return res.status(400).json({ message: "DOB cannot be in the future" });
      }
    }

    // Gender validation
    if (gender !== undefined) {
      const allowed = ["male", "female", "other", ""];
      if (!allowed.includes(gender)) {
        return res.status(400).json({ message: "Invalid gender value" });
      }
    }

    // NIC validation (Sri Lanka: 9 digits + V/X or 12 digits)
    if (nic !== undefined && nic !== null && nic !== "") {
      const nicStr = String(nic).trim();
      const nicRegex = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/;
      if (!nicRegex.test(nicStr)) {
        return res.status(400).json({ message: "Invalid NIC format (123456789V or 200012345678)" });
      }
    }

    // Address validation (if provided)
    if (address !== undefined) {
      if (typeof address !== "object" || Array.isArray(address)) {
        return res.status(400).json({ message: "Address must be an object" });
      }
      if (address.city !== undefined && String(address.city).trim().length === 0) {
        return res.status(400).json({ message: "City cannot be empty" });
      }
      if (address.district !== undefined && String(address.district).trim().length === 0) {
        return res.status(400).json({ message: "District cannot be empty" });
      }
      if (address.line1 !== undefined && String(address.line1).trim().length === 0) {
        return res.status(400).json({ message: "Address line cannot be empty" });
      }
    }

    // Emergency contact validation (if provided)
    if (emergencyContact !== undefined) {
      if (typeof emergencyContact !== "object" || Array.isArray(emergencyContact)) {
        return res.status(400).json({ message: "Emergency contact must be an object" });
      }

      if (emergencyContact.phone !== undefined && emergencyContact.phone !== null && emergencyContact.phone !== "") {
        const p = String(emergencyContact.phone).replace(/\s+/g, "");
        // basic Sri Lanka-ish pattern: allow +94 / 0 / plain 9–10 digits
        const phoneRegex = /^(?:\+94|0)?\d{9}$/;
        if (!phoneRegex.test(p)) {
          return res.status(400).json({ message: "Invalid emergency phone number" });
        }
      }
    }

    // Blood group validation
    if (bloodGroup !== undefined && bloodGroup !== null && bloodGroup !== "") {
      const bg = String(bloodGroup).trim();
      const bgRegex = /^(A|B|AB|O)[+-]$/i;
      if (!bgRegex.test(bg)) {
        return res.status(400).json({ message: "Invalid blood group (A+, O-, AB+)" });
      }
    }

    // Arrays validation
    if (allergies !== undefined && !Array.isArray(allergies)) {
      return res.status(400).json({ message: "Allergies must be an array" });
    }
    if (chronicConditions !== undefined && !Array.isArray(chronicConditions)) {
      return res.status(400).json({ message: "Chronic conditions must be an array" });
    }

    // Height/Weight validation
    if (heightCm !== undefined) {
      const h = Number(heightCm);
      if (Number.isNaN(h) || h < 30 || h > 250) {
        return res.status(400).json({ message: "Height must be between 30 and 250 cm" });
      }
    }
    if (weightKg !== undefined) {
      const w = Number(weightKg);
      if (Number.isNaN(w) || w < 2 || w > 300) {
        return res.status(400).json({ message: "Weight must be between 2 and 300 kg" });
      }
    }
    // ---------------- END VALIDATION ----------------

    const update = {};

    // Basic fields
    if (req.body.fullName !== undefined) update.fullName = req.body.fullName;
    if (req.body.dob !== undefined) update.dob = req.body.dob;
    if (req.body.gender !== undefined) update.gender = req.body.gender;
    if (req.body.nic !== undefined) update.nic = req.body.nic;

    // Nested address
    if (req.body.address) {
      update["address.district"] = req.body.address.district;
      update["address.city"] = req.body.address.city;
      update["address.line1"] = req.body.address.line1;
    }

    // Nested emergency contact
    if (req.body.emergencyContact) {
      update["emergencyContact.name"] = req.body.emergencyContact.name;
      update["emergencyContact.phone"] = req.body.emergencyContact.phone;
      update["emergencyContact.relationship"] = req.body.emergencyContact.relationship;
    }

    // Medical
    if (req.body.bloodGroup !== undefined) update.bloodGroup = req.body.bloodGroup;
    if (req.body.allergies !== undefined) update.allergies = req.body.allergies;
    if (req.body.chronicConditions !== undefined) update.chronicConditions = req.body.chronicConditions;
    if (req.body.heightCm !== undefined) update.heightCm = req.body.heightCm;
    if (req.body.weightKg !== undefined) update.weightKg = req.body.weightKg;

    const patient = await Patient.findOneAndUpdate(
      {
        userId,
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!patient) return res.status(404).json({ message: "Profile not found" });

    return res.json({ message: "Profile updated successfully", patient });
  } catch (e) {
    if (e?.name === "ValidationError") {
      return res.status(400).json({ message: e.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    console.log("AVATAR upload hit ✅");
    console.log("req.file =", req.file); // ✅ add this

    const userId = req.user.userId;

    if (!req.file?.path) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    // multer-storage-cloudinary gives secure URL in req.file.path
    const avatarUrl = req.file.path;
    console.log("avatarUrl =", avatarUrl); // ✅ add this

    const patient = await Patient.findOneAndUpdate(
      { userId , $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }], },
      { $set: { avatarUrl }  },
      { returnDocument: "after", runValidators: true }
    );

    if (!patient) return res.status(404).json({ message: "Profile not found" });

    return res.json({ message: "Avatar updated", avatarUrl });
  } catch (e) {
    console.error("UPLOAD AVATAR ERROR ❌", e);
    return res.status(500).json({ message: "Server error" });
  }
};


module.exports = { getMyProfile, updateMyProfile , uploadAvatar };
