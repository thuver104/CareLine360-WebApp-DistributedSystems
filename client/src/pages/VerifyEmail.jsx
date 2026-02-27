import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  // take from route state OR localStorage (for refresh)
  const [identifier, setIdentifier] = useState(
    location.state?.identifier || localStorage.getItem("verifyIdentifier") || ""
  );

  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(""); // "success" | "error" | ""
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (identifier) localStorage.setItem("verifyIdentifier", identifier);
  }, [identifier]);

  const send = async () => {
    setMsg("");
    setMsgType("");

    if (!identifier.trim()) {
      setMsgType("error");
      setMsg("Email is required");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/email/send-verify-otp", { identifier });
      setMsgType("success");
      setMsg(res.data.message || "OTP sent");
    } catch (e) {
      setMsgType("error");
      setMsg(e.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setMsg("");
    setMsgType("");

    if (!identifier.trim()) {
      setMsgType("error");
      setMsg("Email is required");
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setMsgType("error");
      setMsg("OTP must be exactly 6 digits");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/email/verify-otp", {
        identifier,
        otp: otp.trim(),
      });

      setMsgType("success");
      setMsg(res.data.message || "Email verified");

      localStorage.removeItem("verifyIdentifier");

      // go to login after verify
      setTimeout(() => navigate("/login"), 700);
    } catch (e) {
      setMsgType("error");
      setMsg(e.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const msgClass =
    msgType === "success"
      ? "text-green-700"
      : msgType === "error"
      ? "text-red-700"
      : "text-blue-700";

  return (
    <div className="max-w-md mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Verify Email</h1>

      {msg && <div className={`text-sm ${msgClass}`}>{msg}</div>}

      <input
        className="w-full border p-2"
        placeholder="Email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
      />

      <button
        className="w-full bg-black text-white p-2 disabled:opacity-60"
        onClick={send}
        disabled={loading}
      >
        {loading ? "Sending..." : "Send OTP"}
      </button>

      <input
        className="w-full border p-2"
        placeholder="6-digit OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        inputMode="numeric"
        maxLength={6}
      />

      <button
        className="w-full bg-black text-white p-2 disabled:opacity-60"
        onClick={verify}
        disabled={loading}
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
    </div>
  );
}