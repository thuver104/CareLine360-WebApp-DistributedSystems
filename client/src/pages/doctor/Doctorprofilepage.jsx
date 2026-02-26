import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  FileText,
  DollarSign,
  Star,
  Shield,
  Key,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import {
  getDoctorProfile,
  updateDoctorProfile,
  updateDoctorAvatar,
} from "../../api/doctorApi";
import { clearAuth } from "../../auth/authStorage";
import { disconnectSocket } from "../../socket/socketClient";
import { useDoctorContext } from "../../components/layout/DashboardLayout";
import { useToast } from "../../components/ui/Toast";
import { useBase64Image } from "../../hooks/useBase64Image";
import { getInitials } from "../../utils/colors";
import { api } from "../../api/axios"; // named export

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

function Section({ icon: Icon, title, children }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/10">
        <div className="p-2 rounded-lg bg-teal-500/15">
          <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        </div>
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors";

export default function DoctorProfilePage() {
  const navigate = useNavigate();
  const { refreshProfile } = useDoctorContext();
  const { toast } = useToast();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState({
    fullName: "",
    specialization: "",
    qualifications: "",
    experience: "",
    bio: "",
    licenseNumber: "",
    consultationFee: "",
    phone: "",
  });
  const avatar = useBase64Image({ maxSizeMB: 2 });

  useEffect(() => {
    getDoctorProfile()
      .then((r) => {
        const d = r.data.doctor;
        setDoctor(d);
        setForm({
          fullName: d.fullName || "",
          specialization: d.specialization || "",
          qualifications: (d.qualifications || []).join(", "),
          experience: d.experience ?? "",
          bio: d.bio || "",
          licenseNumber: d.licenseNumber || "",
          consultationFee: d.consultationFee ?? "",
          phone: d.phone || "",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  // Phone: optional country code (+XX or 00XX) followed by exactly 10 digits
  // e.g. +94771234567, 0771234567, +1 800 123 4567 (spaces stripped)
  const validateForm = () => {
    const errors = {};
    const phone = form.phone.trim();
    if (phone) {
      // Strip spaces/dashes for counting after optional country-code prefix
      const stripped = phone.replace(/[\s\-().]/g, "");
      // Allow optional leading + or 00, then exactly 10 digits
      const phoneRx = /^(\+|00)?\d{10,12}$/;
      if (!phoneRx.test(stripped)) {
        errors.phone =
          "Enter a valid phone number with country code (e.g. +94771234567 — 10 digits)";
      }
    }
    const exp = Number(form.experience);
    if (form.experience !== "" && (isNaN(exp) || exp < 0)) {
      errors.experience = "Years of experience cannot be negative.";
    } else if (form.experience !== "" && exp > 40) {
      errors.experience = "Years of experience cannot exceed 40 years.";
    }
    const fee = Number(form.consultationFee);
    if (form.consultationFee !== "") {
      if (isNaN(fee) || fee < 0) {
        errors.consultationFee = "Consultation fee cannot be negative.";
      } else if (fee > 0 && fee < 1500) {
        errors.consultationFee = "Consultation fee must be at least LKR 1,500.";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await updateDoctorProfile({
        ...form,
        qualifications: form.qualifications
          .split(",")
          .map((q) => q.trim())
          .filter(Boolean),
        experience: Number(form.experience) || 0,
        consultationFee: Number(form.consultationFee) || 0,
      });
      if (avatar.base64) {
        await updateDoctorAvatar(avatar.base64);
        avatar.reset();
      }
      refreshProfile?.();
      toast("Profile updated successfully.", "success");
      getDoctorProfile().then((r) => setDoctor(r.data.doctor));
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to save profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Clear field error on change
  const set = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    if (formErrors[key])
      setFormErrors((p) => {
        const n = { ...p };
        delete n[key];
        return n;
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <span className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/doctor/dashboard")}
            className="p-2 rounded-xl glass-btn text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              My Profile
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {doctor?.doctorId} · {doctor?.specialization || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <nav className="flex border-b border-gray-100 dark:border-white/10 px-4">
          {[
            { id: "profile", label: "Profile Details", icon: User },
            { id: "security", label: "Password & Security", icon: Shield },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === id
                  ? "border-teal-500 text-teal-600 dark:text-teal-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group flex-shrink-0">
                  {avatar.preview || doctor?.avatarUrl ? (
                    <img
                      src={avatar.preview || doctor.avatarUrl}
                      alt="Avatar"
                      className="w-24 h-24 rounded-2xl object-cover ring-4 ring-teal-400/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-teal-400/20">
                      {getInitials(doctor?.fullName || "D")}
                    </div>
                  )}
                  <div
                    className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={avatar.triggerPicker}
                  >
                    <Upload className="h-6 w-6 text-white" />
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
                    className="px-4 py-2 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-sm font-medium hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors disabled:opacity-50"
                  >
                    {avatar.loading ? "Processing…" : "Change Photo"}
                  </button>
                  <p className="text-xs text-gray-400 mt-1.5">
                    JPG, PNG, WebP — max 2MB
                  </p>
                  {avatar.error && (
                    <p className="text-xs text-red-500 mt-1">{avatar.error}</p>
                  )}
                  {avatar.preview && (
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> New photo ready — save
                      to apply
                    </p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-4 text-center hidden md:flex">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {doctor?.rating > 0
                        ? Number(doctor.rating).toFixed(1)
                        : "—"}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center justify-center gap-0.5 mt-0.5">
                      <Star className="h-3 w-3 text-amber-400" /> Rating
                    </p>
                  </div>
                  <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {doctor?.totalRatings ?? 0}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Reviews</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Full Name">
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={set("fullName")}
                    className={INPUT}
                  />
                </Field>

                {/* Phone with validation */}
                <Field label="Phone Number">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="+94 77 123 4567"
                    className={`${INPUT} ${formErrors.phone ? "border-red-400 dark:border-red-500 focus:ring-red-400" : ""}`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {formErrors.phone}
                    </p>
                  )}
                </Field>

                <Field label="Specialization">
                  <select
                    value={form.specialization}
                    onChange={set("specialization")}
                    className={INPUT}
                  >
                    <option value="">Select specialization</option>
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="License Number">
                  <input
                    type="text"
                    value={form.licenseNumber}
                    onChange={set("licenseNumber")}
                    className={INPUT}
                  />
                </Field>

                {/* Experience with validation */}
                <Field label="Years of Experience">
                  <input
                    type="number"
                    value={form.experience}
                    onChange={set("experience")}
                    min={0}
                    max={40}
                    className={`${INPUT} ${formErrors.experience ? "border-red-400 dark:border-red-500 focus:ring-red-400" : ""}`}
                  />
                  {formErrors.experience && (
                    <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {formErrors.experience}
                    </p>
                  )}
                </Field>

                {/* Consultation Fee with validation */}
                <Field label="Consultation Fee (LKR)">
                  <input
                    type="number"
                    value={form.consultationFee}
                    onChange={set("consultationFee")}
                    min={0}
                    className={`${INPUT} ${formErrors.consultationFee ? "border-red-400 dark:border-red-500 focus:ring-red-400" : ""}`}
                  />
                  {formErrors.consultationFee && (
                    <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {formErrors.consultationFee}
                    </p>
                  )}
                </Field>

                <div className="md:col-span-2">
                  <Field label="Qualifications (comma-separated)">
                    <input
                      type="text"
                      value={form.qualifications}
                      onChange={set("qualifications")}
                      placeholder="MBBS, MD, MRCP"
                      className={INPUT}
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Bio">
                    <textarea
                      rows={3}
                      value={form.bio}
                      onChange={set("bio")}
                      placeholder="Brief description about your practice…"
                      className={`${INPUT} resize-none`}
                    />
                  </Field>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-8">
              <PasswordResetSection />
              <DangerZone />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordResetSection() {
  const [step, setStep] = useState("idle");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Use GET /auth/me — always returns the authenticated user with their email
  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => setEmail(r.data.user?.email || ""))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // POST /auth/password/forgot   body: { identifier }
  const sendOtp = async () => {
    setLoading(true);
    setMsg("");
    setError("");
    try {
      await api.post("/auth/password/forgot", { identifier: email });
      setStep("otp-sent");
      setCountdown(60);
      setMsg("OTP sent to your registered email address.");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // POST /auth/password/reset   body: { identifier, otp, newPassword }
  // Backend requires: 8+ chars, uppercase, number, special char — validate client-side first
  const verifyOtpAndReset = async () => {
    if (newPassword !== confirmPw) return setError("Passwords do not match.");
    if (newPassword.length < 8)
      return setError("Password must be at least 8 characters.");
    if (!/[A-Z]/.test(newPassword))
      return setError("Password must include at least one uppercase letter.");
    if (!/[0-9]/.test(newPassword))
      return setError("Password must include at least one number.");
    if (!/[^A-Za-z0-9]/.test(newPassword))
      return setError(
        "Password must include at least one special character (e.g. @, #, !).",
      );
    setLoading(true);
    setMsg("");
    setError("");
    try {
      await api.post("/auth/password/reset", {
        identifier: email,
        otp,
        newPassword,
      });
      setMsg("Password changed successfully. You will be logged out shortly.");
      setStep("idle");
      setOtp("");
      setNewPassword("");
      setConfirmPw("");
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "Failed to reset password. Check your OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  const INPUT =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-white/10">
        <div className="p-2 rounded-lg bg-teal-500/15">
          <Key className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            Change Password
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            We'll send an OTP to your registered email for verification.
          </p>
        </div>
      </div>
      {msg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" /> {msg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {step === "idle" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Registered Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className={`${INPUT} cursor-not-allowed opacity-70`}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              OTP will be sent to this email address.
            </p>
          </div>
          <button
            onClick={sendOtp}
            disabled={loading || !email}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                Sending…
              </>
            ) : (
              "Send OTP to Email"
            )}
          </button>
        </div>
      )}

      {step === "otp-sent" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Enter OTP
            </label>
            <OtpInput value={otp} onChange={setOtp} />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-gray-400">
                OTP valid for 10 minutes.
              </p>
              {countdown > 0 ? (
                <p className="text-[11px] text-gray-400">
                  Resend in {countdown}s
                </p>
              ) : (
                <button
                  onClick={sendOtp}
                  disabled={loading}
                  className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className={`${INPUT} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {newPassword && <PasswordStrength password={newPassword} />}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConf ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter new password"
                className={`${INPUT} pr-10 ${confirmPw && confirmPw !== newPassword ? "border-red-400 focus:ring-red-400" : confirmPw && confirmPw === newPassword ? "border-emerald-400 focus:ring-emerald-400" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConf(!showConf)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConf ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {confirmPw && confirmPw !== newPassword && (
              <p className="text-[11px] text-red-500 mt-1">
                Passwords do not match
              </p>
            )}
            {confirmPw && confirmPw === newPassword && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Passwords match
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep("idle");
                setOtp("");
                setNewPassword("");
                setConfirmPw("");
                setError("");
              }}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={verifyOtpAndReset}
              disabled={loading || otp.length < 4 || !newPassword || !confirmPw}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                  Verifying…
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" /> Verify & Change Password
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OtpInput({ value, onChange }) {
  const digits = 6;
  // Array.from always produces exactly `digits` slots regardless of value length
  const chars = Array.from({ length: digits }, (_, i) => value[i] || "");

  const handleInput = (i, e) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = chars.map((c) => c);
    arr[i] = v;
    onChange(arr.join(""));
    if (v && i < digits - 1)
      document.getElementById(`otp-box-${i + 1}`)?.focus();
  };
  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (chars[i]) {
        // clear current box first
        const arr = chars.map((c) => c);
        arr[i] = "";
        onChange(arr.join(""));
      } else if (i > 0) {
        document.getElementById(`otp-box-${i - 1}`)?.focus();
      }
    }
  };
  const handlePaste = (e) => {
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, digits);
    onChange(paste);
    e.preventDefault();
    document
      .getElementById(`otp-box-${Math.min(paste.length, digits - 1)}`)
      ?.focus();
  };

  return (
    <div
      className="flex gap-2"
      role="group"
      aria-label="One-time password input"
    >
      {chars.map((char, i) => (
        <input
          key={i}
          id={`otp-box-${i}`}
          name={`otp-digit-${i}`}
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

function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Symbol", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const COLOR = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
    "bg-emerald-600",
  ];
  const LABEL = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? COLOR[score] : "bg-gray-200 dark:bg-white/10"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p
          className={`text-[11px] font-medium ${score <= 1 ? "text-red-500" : score <= 2 ? "text-orange-500" : score <= 3 ? "text-yellow-600" : "text-emerald-600 dark:text-emerald-400"}`}
        >
          {LABEL[score]}
        </p>
        <div className="flex gap-2">
          {checks.map(({ label, ok }) => (
            <span
              key={label}
              className={`text-[10px] flex items-center gap-0.5 ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}
            >
              {ok ? "✓" : "○"} {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DangerZone() {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const CONFIRM_PHRASE = "DELETE MY ACCOUNT";

  // DELETE /api/doctor/account — permanently removes the Doctor profile and User account.
  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await api.delete("/doctor/account");
      clearAuth();
      disconnectSocket();
      navigate("/");
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "Failed to delete account. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-red-200 dark:border-red-900/50 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900/50">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <div>
          <h3 className="font-semibold text-red-700 dark:text-red-400 text-sm">
            Danger Zone
          </h3>
          <p className="text-xs text-red-500 dark:text-red-500 mt-0.5">
            Irreversible actions. Proceed with extreme caution.
          </p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Delete Account
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Your profile and account will be <strong>permanently deleted</strong> from our
              system. Existing patient appointments and medical records are retained
              for compliance. <strong>This action cannot be undone.</strong>
            </p>
          </div>
          {!confirm && (
            <button
              onClick={() => setConfirm(true)}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Account
            </button>
          )}
        </div>
        {confirm && (
          <div className="space-y-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40">
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
            <p className="text-sm text-red-700 dark:text-red-400">
              Type <strong className="font-mono">{CONFIRM_PHRASE}</strong> to
              confirm permanent deletion:
            </p>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm font-mono focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirm(false);
                  setInput("");
                  setError("");
                }}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || input !== CONFIRM_PHRASE}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" /> Yes, Permanently Delete
                    My Account
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
