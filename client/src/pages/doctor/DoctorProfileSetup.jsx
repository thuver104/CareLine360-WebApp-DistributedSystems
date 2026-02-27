import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  Upload,
  Mail,
} from "lucide-react";
import { createDoctorProfile, updateDoctorAvatar } from "../../api/doctorApi";
import { useBase64Image } from "../../hooks/useBase64Image";
import { api } from "../../api/axios";

const SPECIALIZATIONS = [
  "General Practitioner",
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedic Surgeon",
  "Pediatrician",
  "Psychiatrist",
  "Radiologist",
  "Oncologist",
  "Gynecologist",
  "Ophthalmologist",
  "ENT Specialist",
  "Endocrinologist",
  "Urologist",
  "Pulmonologist",
  "Gastroenterologist",
];

const INPUT_CLS =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 " +
  "bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors";

const ERR_CLS = "border-red-400 dark:border-red-500 focus:ring-red-400";

// ── Helpers ──────────────────────────────────────────────────────────────────
function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function Alert({ type = "error", children }) {
  const styles = {
    error:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",
    success:
      "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400",
  };
  const Icon = type === "success" ? CheckCircle : AlertTriangle;
  return (
    <div
      className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${styles[type]}`}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

// 6-box OTP input
function OtpInput({ value, onChange }) {
  const DIGITS = 6;
  const chars = Array.from({ length: DIGITS }, (_, i) => value[i] || "");

  const handleInput = (i, e) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = [...chars];
    arr[i] = v;
    onChange(arr.join(""));
    if (v && i < DIGITS - 1)
      document.getElementById(`setup-otp-${i + 1}`)?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (chars[i]) {
        const arr = [...chars];
        arr[i] = "";
        onChange(arr.join(""));
      } else if (i > 0) {
        document.getElementById(`setup-otp-${i - 1}`)?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, DIGITS);
    onChange(paste);
    e.preventDefault();
    document
      .getElementById(`setup-otp-${Math.min(paste.length, DIGITS - 1)}`)
      ?.focus();
  };

  return (
    <div
      className="flex gap-2 justify-center"
      role="group"
      aria-label="One-time password"
    >
      {chars.map((char, i) => (
        <input
          key={i}
          id={`setup-otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoComplete="one-time-code"
          aria-label={`OTP digit ${i + 1}`}
          value={char}
          onChange={(e) => handleInput(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 transition-all"
        />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DoctorProfileSetup() {
  const navigate = useNavigate();
  const avatar = useBase64Image({ maxSizeMB: 2 });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [globalMsg, setGlobalMsg] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    licenseNumber: "",
    specialization: "",
    qualifications: "",
    experience: "",
    consultationFee: "",
    bio: "",
  });

  // OTP step
  const [userEmail, setUserEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Fetch the logged-in user's email for OTP targeting
  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => setUserEmail(r.data.user?.email || ""))
      .catch(() => {});
  }, []);

  // Resend countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const set = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    if (errors[key])
      setErrors((p) => {
        const n = { ...p };
        delete n[key];
        return n;
      });
  };

  // ── Step 1 validation ─────────────────────────────────────────────────────
  const validateStep1 = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required.";

    if (form.phone.trim()) {
      const stripped = form.phone.trim().replace(/[\s\-().]/g, "");
      if (!/^(\+|00)?\d{10,12}$/.test(stripped))
        errs.phone =
          "Enter a valid phone number (e.g. +94771234567 — 10 digits after country code).";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Step 2 validation ─────────────────────────────────────────────────────
  const validateStep2 = () => {
    const errs = {};
    if (!form.specialization)
      errs.specialization = "Specialization is required.";

    const exp = Number(form.experience);
    if (form.experience !== "") {
      if (isNaN(exp) || exp < 0)
        errs.experience = "Experience cannot be negative.";
      else if (exp > 40) errs.experience = "Experience cannot exceed 40 years.";
    }

    const fee = Number(form.consultationFee);
    if (form.consultationFee !== "") {
      if (isNaN(fee) || fee < 0)
        errs.consultationFee = "Fee cannot be negative.";
      else if (fee > 0 && fee < 1500)
        errs.consultationFee = "Consultation fee must be at least LKR 1,500.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goToStep2 = () => {
    setGlobalError("");
    if (validateStep1()) setStep(2);
  };

  // ── Submit profile → send OTP → step 3 ───────────────────────────────────
  const handleSubmit = async () => {
    setGlobalError("");
    if (!validateStep2()) return;

    setLoading(true);
    try {
      await createDoctorProfile({
        ...form,
        qualifications: form.qualifications
          .split(",")
          .map((q) => q.trim())
          .filter(Boolean),
        experience: Number(form.experience) || 0,
        consultationFee: Number(form.consultationFee) || 0,
      });

      if (avatar.base64) await updateDoctorAvatar(avatar.base64);

      if (userEmail) {
        try {
          await api.post("/auth/email/send-verify-otp", {
            identifier: userEmail,
          });
          setGlobalMsg(
            "A 6-digit verification code has been sent to your email.",
          );
        } catch {
          setGlobalMsg(
            "Profile created! OTP send failed — use the Resend button below.",
          );
        }
        setCountdown(60);
        setStep(3);
      } else {
        navigate("/doctor/dashboard");
      }
    } catch (err) {
      setGlobalError(
        err?.response?.data?.message ||
          "Failed to save profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setGlobalError("");
    setGlobalMsg("");
    try {
      await api.post("/auth/email/send-verify-otp", { identifier: userEmail });
      setCountdown(60);
      setGlobalMsg("A new OTP has been sent to your email.");
    } catch (e) {
      setGlobalError(e?.response?.data?.message || "Failed to resend OTP.");
    }
  };

  const verifyOtp = async () => {
    if (otp.length < 6) return setGlobalError("Enter the full 6-digit code.");
    setGlobalError("");
    setLoading(true);
    try {
      await api.post("/auth/email/verify-otp", { identifier: userEmail, otp });
      navigate("/doctor/dashboard");
    } catch (e) {
      setGlobalError(e?.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step indicator ────────────────────────────────────────────────────────
  const STEPS = [
    { num: 1, label: "Personal", icon: User },
    { num: 2, label: "Professional", icon: Briefcase },
    { num: 3, label: "Verify Email", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 shadow-lg mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Complete Your Profile
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Your account has been approved! Set up your profile to get started.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map((s, idx) => {
            const done = step > s.num;
            const active = step === s.num;
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex items-center gap-1">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                    active
                      ? "bg-teal-600 text-white shadow-md shadow-teal-500/30"
                      : done
                        ? "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}
                >
                  {done ? (
                    <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="text-xs font-semibold">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 rounded ${step > s.num ? "bg-teal-500" : "bg-gray-200 dark:bg-gray-700"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
          {globalError && (
            <div className="mb-5">
              <Alert type="error">{globalError}</Alert>
            </div>
          )}
          {globalMsg && (
            <div className="mb-5">
              <Alert type="success">{globalMsg}</Alert>
            </div>
          )}

          {/* ── STEP 1: Personal ───────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Personal Information
              </h2>

              {/* Avatar picker */}
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-2xl overflow-hidden bg-teal-50 dark:bg-gray-700 border-2 border-teal-200 dark:border-teal-800 flex items-center justify-center flex-shrink-0 cursor-pointer group relative"
                  onClick={avatar.triggerPicker}
                >
                  {avatar.preview ? (
                    <img
                      src={avatar.preview}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-teal-400" />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <input
                    ref={avatar.inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={avatar.handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={avatar.triggerPicker}
                    disabled={avatar.loading}
                    className="bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-400 text-sm font-medium px-4 py-2 rounded-lg border border-teal-200 dark:border-teal-800 transition-colors disabled:opacity-50"
                  >
                    {avatar.loading ? "Processing…" : "Upload Photo"}
                  </button>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, WebP — max 2 MB
                  </p>
                  {avatar.error && (
                    <p className="text-xs text-red-500 mt-1">{avatar.error}</p>
                  )}
                  {avatar.preview && (
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Photo selected
                    </p>
                  )}
                </div>
              </div>

              <Field label="Full Name" required error={errors.fullName}>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={set("fullName")}
                  placeholder="Dr. Jane Smith"
                  className={`${INPUT_CLS} ${errors.fullName ? ERR_CLS : ""}`}
                />
              </Field>

              <Field label="Phone Number" error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+94 77 123 4567"
                  className={`${INPUT_CLS} ${errors.phone ? ERR_CLS : ""}`}
                />
              </Field>

              <Field label="License Number">
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={set("licenseNumber")}
                  placeholder="Medical registration number"
                  className={INPUT_CLS}
                />
              </Field>

              <div className="flex justify-end pt-2">
                <button
                  onClick={goToStep2}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Professional ───────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Professional Details
              </h2>

              <Field
                label="Specialization"
                required
                error={errors.specialization}
              >
                <select
                  value={form.specialization}
                  onChange={set("specialization")}
                  className={`${INPUT_CLS} ${errors.specialization ? ERR_CLS : ""}`}
                >
                  <option value="">Select specialization</option>
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>

              <Field label="Qualifications (comma-separated)">
                <input
                  type="text"
                  value={form.qualifications}
                  onChange={set("qualifications")}
                  placeholder="MBBS, MD, MRCP"
                  className={INPUT_CLS}
                />
              </Field>

              <Field label="Years of Experience" error={errors.experience}>
                <input
                  type="number"
                  value={form.experience}
                  onChange={set("experience")}
                  placeholder="e.g. 5"
                  min={0}
                  max={40}
                  className={`${INPUT_CLS} ${errors.experience ? ERR_CLS : ""}`}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Maximum 40 years.
                </p>
              </Field>

              <Field
                label="Consultation Fee (LKR)"
                error={errors.consultationFee}
              >
                <input
                  type="number"
                  value={form.consultationFee}
                  onChange={set("consultationFee")}
                  placeholder="e.g. 2000"
                  min={0}
                  className={`${INPUT_CLS} ${errors.consultationFee ? ERR_CLS : ""}`}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Minimum LKR 1,500 if specified.
                </p>
              </Field>

              <Field label="Bio">
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={set("bio")}
                  placeholder="Brief description about your practice…"
                  className={`${INPUT_CLS} resize-none`}
                />
              </Field>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => {
                    setStep(1);
                    setErrors({});
                    setGlobalError("");
                  }}
                  className="text-gray-500 dark:text-gray-400 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {loading ? "Saving…" : "Save & Continue →"}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Email OTP Verification ─────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-teal-500/15 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Verify Your Email
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {userEmail || "your email"}
                  </span>
                </p>
              </div>

              <OtpInput value={otp} onChange={setOtp} />

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Code valid for 10 minutes</span>
                {countdown > 0 ? (
                  <span>Resend in {countdown}s</span>
                ) : (
                  <button
                    onClick={resendOtp}
                    className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Verifying…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" /> Verify & Go to Dashboard
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                You can also{" "}
                <button
                  onClick={() => navigate("/doctor/dashboard")}
                  className="text-teal-600 dark:text-teal-400 hover:underline"
                >
                  skip for now
                </button>{" "}
                and verify later from your profile settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
