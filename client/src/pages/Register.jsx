import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";
import { setAuth } from "../auth/authStorage";

export default function Register() {
  const nav = useNavigate();
  const [role, setRole] = useState("patient");
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await api.post("/auth/register", {
        role,
        fullName,
        identifier: identifier.trim(),
        password,
      });

      // Doctor: no tokens (PENDING)
      if (role === "doctor") {
        setMsg(res.data.message || "Doctor registered. Awaiting approval.");
        nav("/login");
        return;
      }

      // Patient: tokens returned
      setAuth(res.data);
      nav("/login");
    } catch (err) {
      setMsg(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Register failed",
      );
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Register</h1>

      {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}

      <form onSubmit={submit} className="space-y-3">
        <select
          className="w-full border p-2"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>

        <input
          className="w-full border p-2"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          className="w-full border p-2"
          placeholder="Email or Phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <input
          className="w-full border p-2"
          placeholder="Password (e.g., Test@1234)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-black text-white p-2">
          Create Account
        </button>
      </form>
    </div>
  );
}
