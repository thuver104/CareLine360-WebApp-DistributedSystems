import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { setAuth } from "../auth/authStorage";

export default function Login() {
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await api.post("/auth/login", { identifier: identifier.trim(), password });
      setAuth(res.data);

      const role = res.data.user.role;
      if (role === "patient") nav("/patient/dashboard");
      else if (role === "doctor") nav("/doctor/dashboard");
      else if (role === "admin") nav("/admin/dashboard");
      else if (role === "responder") nav("/admin/dashboard/emergencies");
      else nav("/");
    } catch (err) {
      const apiMsg = err.response?.data?.message;
      // doctor pending will show here
      setMsg(apiMsg || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>

      {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}

      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border p-2" placeholder="Email or Phone" value={identifier} onChange={(e)=>setIdentifier(e.target.value)} />
        <input className="w-full border p-2" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />

        <button className="w-full bg-black text-white p-2">Login</button>
      </form>

      <div className="mt-4 text-sm flex justify-between">
        <Link to="/register" className="underline">Create account</Link>
        <Link to="/forgot-password" className="underline">Forgot password?</Link>
      </div>
    </div>
  );
}
