import { useState } from "react";
import { api } from "../api/axios";

export default function VerifyEmail() {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");

  const send = async () => {
    setMsg("");
    try {
      const res = await api.post("/auth/email/send-verify-otp", { identifier });
      setMsg(res.data.message);
    } catch (e) {
      setMsg(e.response?.data?.message || "Failed to send OTP");
    }
  };

  const verify = async () => {
    setMsg("");
    try {
      const res = await api.post("/auth/email/verify-otp", { identifier, otp });
      setMsg(res.data.message);
    } catch (e) {
      setMsg(e.response?.data?.message || "OTP verification failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Verify Email</h1>

      {msg && <div className="text-sm text-blue-700">{msg}</div>}

      <input className="w-full border p-2" placeholder="Email" value={identifier} onChange={(e)=>setIdentifier(e.target.value)} />
      <button className="w-full bg-black text-white p-2" onClick={send}>Send OTP</button>

      <input className="w-full border p-2" placeholder="6-digit OTP" value={otp} onChange={(e)=>setOtp(e.target.value)} />
      <button className="w-full bg-black text-white p-2" onClick={verify}>Verify</button>
    </div>
  );
}
