const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Counter = require("../models/Counter");
const Otp = require("../models/Otp");
const { sendEmail } = require("./emailService");
const { generateOtp, hashOtp } = require("../utils/otp");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/tokens");

const getNextPatientId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { key: "patient" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `PAT-${String(counter.seq).padStart(6, "0")}`;
};

// Register for patient & doctor only (doctor = PENDING, no tokens)
const registerUser = async ({ identifier, password, fullName, role }) => {
  // Normalize identifier to avoid whitespace / formatting issues
  const rawIdentifier = (identifier || "").trim();

  if (!["patient", "doctor"].includes(role)) {
    return { status: 400, data: { message: "Only patient or doctor can self-register" } };
  }

  const isEmail = rawIdentifier.includes("@");
  const email = isEmail ? rawIdentifier.toLowerCase() : undefined;
  const phone = !isEmail ? rawIdentifier : undefined;

  const existing = await User.findOne(isEmail ? { email } : { phone });
  if (existing) return { status: 409, data: { message: "User already exists" } };

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    role,
    status: role === "doctor" ? "PENDING" : "ACTIVE",
    fullName,
    email,
    phone,
    passwordHash,
  });

  // Doctor: no auto login
  if (role === "doctor") {
    return {
      status: 201,
      data: {
        message: "Doctor registered successfully. Awaiting admin approval.",
        user: { id: user._id, role: user.role, email: user.email, phone: user.phone, status: user.status },
      },
    };
  }

  // Patient: create patient profile + tokens
  const patientId = await getNextPatientId();
  await Patient.create({ userId: user._id, patientId, fullName });

  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();

  return {
    status: 201,
    data: {
      message: "Registered successfully",
      user: { id: user._id, role: user.role, email: user.email, phone: user.phone, fullName: user.fullName, isVerified: user.isVerified },
      patientId,
      accessToken,
      refreshToken,
    },
  };
};

const loginUser = async ({ identifier, password }) => {
  // Normalize identifier to avoid whitespace / casing issues
  const rawIdentifier = (identifier || "").trim();

  const query = rawIdentifier.includes("@")
    ? { email: rawIdentifier.toLowerCase() }
    : { phone: rawIdentifier };

  const user = await User.findOne(query);
  if (!user) return { status: 401, data: { message: "Invalid credentials" } };
  if (!user.isActive) return { status: 403, data: { message: "Account is deactivated" } };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { status: 401, data: { message: "Invalid credentials" } };

  // Option A: block login unless ACTIVE
  if (user.status !== "ACTIVE") {
    const msg =
      user.role === "doctor"
        ? "Doctor account not approved yet"
        : "Account is not active. Please contact admin.";
    return { status: 403, data: { message: msg, status: user.status } };
  }

  user.lastLoginAt = new Date();

  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();

  return {
    status: 200,
    data: {
      message: "Login success",
      user: { id: user._id, role: user.role, email: user.email, phone: user.phone, fullName: user.fullName, isVerified: user.isVerified },
      accessToken,
      refreshToken,
    },
  };
};

const refreshAccessToken = async ({ refreshToken }) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) return { status: 401, data: { message: "Invalid refresh token" } };

    const match = await bcrypt.compare(refreshToken, user.refreshTokenHash || "");
    if (!match) return { status: 401, data: { message: "Invalid refresh token" } };

    const newAccessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
    return { status: 200, data: { accessToken: newAccessToken } };
  } catch (e) {
    return { status: 401, data: { message: "Refresh token expired/invalid" } };
  }
};

const logoutUser = async ({ userId }) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
  return { status: 200, data: { message: "Logged out" } };
};

const sendEmailVerificationOtp = async ({ identifier }) => {
  const query = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { phone: identifier };

  const user = await User.findOne(query);
  if (!user) return { status: 404, data: { message: "User not found" } };

  if (!user.email) return { status: 400, data: { message: "Email not available for this account" } };
  if (user.isVerified) return { status: 200, data: { message: "Email already verified" } };

  // remove old OTPs for this purpose
  await Otp.deleteMany({ userId: user._id, purpose: "EMAIL_VERIFY" });

  const otp = generateOtp();
  await Otp.create({
    userId: user._id,
    purpose: "EMAIL_VERIFY",
    otpHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    attemptsLeft: 5,
  });

  await sendEmail({
    to: user.email,
    subject: `${process.env.APP_NAME || "CareLine360"} - Verify your email`,
    html: `
      <p>Your verification code is:</p>
      <h2 style="letter-spacing:2px">${otp}</h2>
      <p>This code expires in 10 minutes.</p>
    `,
  });

  return { status: 200, data: { message: "Verification OTP sent to email" } };
};

const verifyEmailOtp = async ({ identifier, otp }) => {
  const query = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { phone: identifier };

  const user = await User.findOne(query);
  if (!user) return { status: 404, data: { message: "User not found" } };

  const record = await Otp.findOne({ userId: user._id, purpose: "EMAIL_VERIFY" });
  if (!record) return { status: 400, data: { message: "OTP not found or expired" } };

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    return { status: 400, data: { message: "OTP expired" } };
  }

  if (record.attemptsLeft <= 0) {
    await Otp.deleteOne({ _id: record._id });
    return { status: 429, data: { message: "Too many attempts. Request a new OTP." } };
  }

  const ok = record.otpHash === hashOtp(otp);
  if (!ok) {
    record.attemptsLeft -= 1;
    await record.save();
    return { status: 400, data: { message: "Invalid OTP" } };
  }

  user.isVerified = true;
  await user.save();
  await Otp.deleteOne({ _id: record._id });

  return { status: 200, data: { message: "Email verified successfully" } };
};

const sendPasswordResetOtp = async ({ identifier }) => {
  const query = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { phone: identifier };

  const user = await User.findOne(query);
  if (!user) return { status: 404, data: { message: "User not found" } };

  if (!user.email) return { status: 400, data: { message: "Email not available for this account" } };

  await Otp.deleteMany({ userId: user._id, purpose: "PASSWORD_RESET" });

  const otp = generateOtp();
  await Otp.create({
    userId: user._id,
    purpose: "PASSWORD_RESET",
    otpHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attemptsLeft: 5,
  });

  await sendEmail({
    to: user.email,
    subject: `${process.env.APP_NAME || "CareLine360"} - Password reset`,
    html: `
      <p>Your password reset code is:</p>
      <h2 style="letter-spacing:2px">${otp}</h2>
      <p>This code expires in 10 minutes.</p>
    `,
  });

  return { status: 200, data: { message: "Password reset OTP sent to email" } };
};

const resetPasswordWithOtp = async ({ identifier, otp, newPassword }) => {
  const query = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { phone: identifier };

  const user = await User.findOne(query);
  if (!user) return { status: 404, data: { message: "User not found" } };

  const record = await Otp.findOne({ userId: user._id, purpose: "PASSWORD_RESET" });
  if (!record) return { status: 400, data: { message: "OTP not found or expired" } };

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    return { status: 400, data: { message: "OTP expired" } };
  }

  if (record.attemptsLeft <= 0) {
    await Otp.deleteOne({ _id: record._id });
    return { status: 429, data: { message: "Too many attempts. Request a new OTP." } };
  }

  const ok = record.otpHash === hashOtp(otp);
  if (!ok) {
    record.attemptsLeft -= 1;
    await record.save();
    return { status: 400, data: { message: "Invalid OTP" } };
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);

  // logout from all devices
  user.refreshTokenHash = undefined;

  await user.save();
  await Otp.deleteOne({ _id: record._id });

  return { status: 200, data: { message: "Password reset successful. Please login again." } };
};


module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  sendEmailVerificationOtp,
  verifyEmailOtp,
  sendPasswordResetOtp,
  resetPasswordWithOtp
};
