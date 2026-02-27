import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [role, setRole] = useState("patient");
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅ NEW
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType("");

    const cleanId = identifier.trim();

    if (!fullName.trim()) {
      setMsgType("error");
      setMsg("Full name is required");
      return;
    }
    if (!cleanId) {
      setMsgType("error");
      setMsg("Email or phone is required");
      return;
    }
    if (!password) {
      setMsgType("error");
      setMsg("Password is required");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/register", {
        role,
        fullName: fullName.trim(),
        identifier: cleanId,
        password,
      });

      if (role === "doctor") {
        setMsgType("success");
        setMsg(res.data?.message || "Doctor registered. Awaiting approval.");
        setTimeout(() => nav("/login"), 700);
        return;
      }

      localStorage.setItem("verifyIdentifier", cleanId);

      setMsgType("success");
      setMsg(res.data?.message || "OTP sent to your email. Please verify.");

      nav("/verify-email", { state: { identifier: cleanId } });
    } catch (err) {
      setMsgType("error");
      setMsg(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Register failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const msgClass =
    msgType === "success"
      ? "mb-3 text-sm text-green-700"
      : msgType === "error"
      ? "mb-3 text-sm text-red-600"
      : "mb-3 text-sm text-blue-700";

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Register</h1>

      {msg && <div className={msgClass}>{msg}</div>}

      <form onSubmit={submit} className="space-y-3">
        <select
          className="w-full border p-2 rounded"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>

        <input
          className="w-full border p-2 rounded"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Email or Phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        {/* ✅ PASSWORD FIELD WITH TOGGLE */}
        <div className="relative">
          <input
            className="w-full border p-2 rounded pr-16"
            placeholder="Password (e.g., Test@1234)"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-black"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button
          disabled={loading}
          className="w-full bg-black text-white p-2 rounded disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        <div className="text-sm text-gray-600 text-center">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => nav("/login")}
            className="text-blue-600 hover:underline"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}