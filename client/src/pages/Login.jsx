import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { setAuth } from "../auth/authStorage";

export default function Login() {
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅ NEW
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false); // ✅ optional

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        identifier: identifier.trim(),
        password,
      });

      setAuth(res.data);

      const role = res.data.user.role;
      if (role === "patient") nav("/patient/dashboard");
      else if (role === "doctor") nav("/doctor/dashboard");
      else if (role === "admin") nav("/admin/dashboard");
      else if (role === "responder") nav("/admin/dashboard/emergencies");
      else nav("/");
    } catch (err) {
      const apiMsg = err.response?.data?.message;
      setMsg(apiMsg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>

      {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}

      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Email or Phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        {/* ✅ PASSWORD WITH SHOW/HIDE */}
        <div className="relative">
          <input
            className="w-full border p-2 rounded pr-16"
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-black"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button
          disabled={loading}
          className="w-full bg-black text-white p-2 rounded disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="mt-4 text-sm flex justify-between">
        <Link to="/register" className="underline">
          Create account
        </Link>
        <Link to="/forgot-password" className="underline">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}