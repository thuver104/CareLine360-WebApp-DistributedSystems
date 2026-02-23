import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [msg, setMsg] = useState("");

  const send = async () => {
    setMsg("");
    try {
      const res = await api.post("/auth/password/forgot", { identifier });
      setMsg(res.data.message);
      nav("/reset-password", { state: { identifier } });
    } catch (e) {
      setMsg(e.response?.data?.message || "Failed to send reset OTP");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Forgot Password</h1>
      {msg && <div className="text-sm text-blue-700">{msg}</div>}
      <input className="w-full border p-2" placeholder="Email" value={identifier} onChange={(e)=>setIdentifier(e.target.value)} />
      <button className="w-full bg-black text-white p-2" onClick={send}>Send OTP</button>
    </div>
  );
}
