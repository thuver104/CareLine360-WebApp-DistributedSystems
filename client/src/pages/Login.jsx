import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { setAuth } from "../auth/authStorage";

export default function Login() {
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [canReactivate, setCanReactivate] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setCanReactivate(false);

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
      const apiMsg = err.response?.data?.message || "Login failed";
      setMsg(apiMsg);

      // show reactivate button when backend says account inactive
      const m = apiMsg.toLowerCase();
      if (
        m.includes("deactiv") ||
        m.includes("inactive") ||
        m.includes("suspend") ||
        m.includes("disabled")
      ) {
        setCanReactivate(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    setMsg("");

    if (!identifier.trim() || !password) {
      setMsg("Enter email/phone and password to reactivate.");
      return;
    }

    try {
      setReactivating(true);

      const res = await api.post("/auth/reactivate", {
        identifier: identifier.trim(),
        password,
      });

      setMsg(res.data?.message || "Account reactivated. Now login again.");
      setCanReactivate(false);
    } catch (err) {
      setMsg(err.response?.data?.message || "Reactivate failed");
    } finally {
      setReactivating(false);
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

        {/* ✅ Reactivate button (only shows if login says deactivated) */}
        {canReactivate && (
          <button
            type="button"
            onClick={handleReactivate}
            disabled={reactivating}
            className="w-full bg-gray-600 text-white p-2 rounded disabled:opacity-60 hover:bg-gray-800"
          >
            {reactivating ? "Reactivating..." : "Reactivate Account"}
          </button>
        )}
      </form>

      <div className="mt-4 text-sm flex justify-between">
        <Link to="/register" className="hover:underline">
          Create account
        </Link>
        <Link to="/forgot-password" className="hover:underline">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}