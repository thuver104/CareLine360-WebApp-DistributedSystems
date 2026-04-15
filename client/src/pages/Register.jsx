import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Users,
  ArrowRight,
} from "lucide-react";

import logo from "../assets/logo.png";
import loginImg from "../assets/images/login.png";

import "./Auth.css";

export default function Register() {
  const nav = useNavigate();
  const [role, setRole] = useState("patient");
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      ? "auth-msg auth-msg--success"
      : msgType === "error"
      ? "auth-msg auth-msg--error"
      : "auth-msg auth-msg--info";

  return (
    <div className="auth-page">
      <div className="auth-noise" />

      {/* ═══════ FORM PANEL (Left) ═══════ */}
      <div className="auth-form-panel">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Link to="/" className="auth-home-btn">
            <ArrowLeft size={14} strokeWidth={1.5} />
            Home
          </Link>
        </motion.div>

        <motion.div
          className="auth-form-container auth-form-container--wide"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Logo */}
          <div className="auth-logo-wrapper">
            <div className="auth-logo-ring">
              <img src={logo} alt="CareLine 360" className="auth-logo" />
            </div>
          </div>

          {/* Brand */}
          <div className="auth-brand">
            <span className="auth-brand-name">
              CareLine <span className="auth-brand-accent">360</span>
            </span>
          </div>

          {/* Header */}
          <span className="auth-overline">Join Us Today</span>
          <h1 className="auth-title">
            Create <span className="auth-title-accent">Account</span>
          </h1>
          <p className="auth-subtitle">
            Start your healthcare journey with CareLine 360
          </p>

          {/* Message */}
          {msg && (
            <motion.div
              className={msgClass}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {msg}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={submit}>
            {/* Role */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="reg-role">
                Register As
              </label>
              <div className="auth-input-wrapper">
                <select
                  id="reg-role"
                  className="auth-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
                <Users size={15} strokeWidth={1.5} className="auth-input-icon" />
              </div>
            </div>

            {/* Full Name */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="reg-name">
                Full Name
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="reg-name"
                  className="auth-input"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
                <User size={15} strokeWidth={1.5} className="auth-input-icon" />
              </div>
            </div>

            {/* Email / Phone */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="reg-identifier">
                Email or Phone
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="reg-identifier"
                  className="auth-input"
                  placeholder="Enter your email or phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="email"
                />
                <Mail size={15} strokeWidth={1.5} className="auth-input-icon" />
              </div>
            </div>

            {/* Password */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="reg-password">
                Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="reg-password"
                  className="auth-input"
                  placeholder="e.g., Test@1234"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: "3rem" }}
                />
                <Lock size={15} strokeWidth={1.5} className="auth-input-icon" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-pw-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={15} strokeWidth={1.5} />
                  ) : (
                    <Eye size={15} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-submit-btn">
              <span className="btn-slide-bg" />
              <span className="btn-text">
                {loading ? (
                  <>
                    <span className="auth-spinner" /> Creating…
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight size={14} />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">or</span>
            <span className="auth-divider-line" />
          </div>

          {/* Footer */}
          <div className="auth-footer-links auth-footer-links--center">
            <span className="auth-footer-text">Already have an account?</span>
            <Link to="/login" className="auth-link auth-link--accent">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ═══════ IMAGE PANEL (Right) ═══════ */}
      <div className="auth-image-panel">
        <div className="auth-float-circle auth-float-circle--1" />
        <div className="auth-float-circle auth-float-circle--2" />
        <div className="auth-float-circle auth-float-circle--3" />
        <div className="auth-img-glow auth-img-glow--right" />

        <motion.div
          className="auth-panel-overlay auth-panel-overlay--left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="auth-panel-overline">CareLine 360</p>
          <h2 className="auth-panel-title">
            Begin Your
            <br />
            Health <em>Journey</em>
          </h2>
        </motion.div>

        <motion.img
          src={loginImg}
          alt="Healthcare professionals"
          className="auth-hero-img"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 1.2,
            delay: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      </div>
    </div>
  );
}
