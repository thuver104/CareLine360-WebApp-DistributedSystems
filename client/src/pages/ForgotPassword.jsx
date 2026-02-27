import { useState, useEffect } from "react";
import { api } from "../api/axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function ResetPassword() {
  const nav = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState(
    location.state?.identifier || localStorage.getItem("resetIdentifier") || ""
  );

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (identifier) {
      localStorage.setItem("resetIdentifier", identifier);
    }
  }, [identifier]);

  const reset = async () => {
    setMsg("");

    if (!otp || otp.length !== 6) {
      setMsg("OTP must be 6 digits");
      return;
    }

    if (!newPassword) {
      setMsg("New password is required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/password/reset", {
        identifier,
        otp,
        newPassword,
      });

      setMsg(res.data?.message || "Password reset successful");

      localStorage.removeItem("resetIdentifier");

      setTimeout(() => nav("/login"), 800);
    } catch (e) {
      setMsg(e.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-semibold text-center">Reset Password</h1>

      {msg && <div className="text-sm text-red-600 text-center">{msg}</div>}

      <input
        className="w-full border p-2"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
      />

      <input
        className="w-full border p-2"
        placeholder="OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        maxLength={6}
      />

      {/* New Password */}
      <div className="relative">
        <input
          className="w-full border p-2 pr-16"
          placeholder="New Password (e.g., NewPass@1234)"
          type={showNew ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowNew(!showNew)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600"
        >
          {showNew ? "Hide" : "Show"}
        </button>
      </div>

      {/* Confirm Password */}
      <div className="relative">
        <input
          className="w-full border p-2 pr-16"
          placeholder="Confirm Password"
          type={showConfirm ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600"
        >
          {showConfirm ? "Hide" : "Show"}
        </button>
      </div>

      <button
        disabled={loading}
        onClick={reset}
        className="w-full bg-black text-white p-2 disabled:opacity-60"
      >
        {loading ? "Resetting..." : "Reset"}
      </button>
    </div>
  );
}