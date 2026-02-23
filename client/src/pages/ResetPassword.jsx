import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/axios";

export default function ResetPassword() {
  const nav = useNavigate();
  const loc = useLocation();
  const [identifier, setIdentifier] = useState(loc.state?.identifier || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  const reset = async () => {
    setMsg("");
    try {
      const res = await api.post("/auth/password/reset", { identifier, otp, newPassword });
      setMsg(res.data.message);
      nav("/login");
    } catch (e) {
      setMsg(e.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Reset Password</h1>
      {msg && <div className="text-sm text-blue-700">{msg}</div>}
      <input className="w-full border p-2" placeholder="Email" value={identifier} onChange={(e)=>setIdentifier(e.target.value)} />
      <input className="w-full border p-2" placeholder="OTP" value={otp} onChange={(e)=>setOtp(e.target.value)} />
      <input className="w-full border p-2" placeholder="New Password (e.g., NewPass@1234)" type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} />
      <button className="w-full bg-black text-white p-2" onClick={reset}>Reset</button>
    </div>
  );
}
