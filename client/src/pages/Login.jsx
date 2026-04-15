import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { setAuth } from "../auth/authStorage";
import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import logo from "../assets/logo.png";
import loginImg from "../assets/images/login.png";

import "./Auth.css";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
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

      // persist tokens to storage so they survive reloads
      setAuth(res.data);

      // notify AuthContext in the same tab so protected routes update immediately
      try {
        login({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken, user: res.data.user });
      } catch (e) {
        // if context isn't available for some reason, storage still has tokens
      }

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
          className="auth-form-container"
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
          <span className="auth-overline">Welcome Back</span>
          <h1 className="auth-title">
            Sign <span className="auth-title-accent">In</span>
          </h1>
          <p className="auth-subtitle">
            Access your healthcare dashboard securely
          </p>

          {/* Error */}
          {msg && (
            <motion.div
              className="auth-msg auth-msg--error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {msg}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={submit}>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="login-identifier">
                Email or Phone
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="login-identifier"
                  className="auth-input"
                  placeholder="Enter your email or phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                />
                <Mail size={15} strokeWidth={1.5} className="auth-input-icon" />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="login-password">
                Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="login-password"
                  className="auth-input"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: "3rem" }}
                />
                <Lock size={15} strokeWidth={1.5} className="auth-input-icon" />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
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
                    <span className="auth-spinner" /> Signing in…
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight size={14} />
                  </>
                )}
              </span>
            </button>

            {/* Reactivate */}
            {canReactivate && (
              <button
                type="button"
                onClick={handleReactivate}
                disabled={reactivating}
                className="auth-submit-btn"
                style={{ marginTop: "0.75rem" }}
              >
                <span className="btn-slide-bg" />
                <span className="btn-text">
                  {reactivating ? (
                    <>
                      <span className="auth-spinner" /> Reactivating…
                    </>
                  ) : (
                    <>
                      Reactivate Account <ArrowRight size={14} />
                    </>
                  )}
                </span>
              </button>
            )}
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">or</span>
            <span className="auth-divider-line" />
          </div>

          {/* Footer */}
          <div className="auth-footer-links">
            <Link to="/register" className="auth-link">
              Create Account
            </Link>
            <Link to="/forgot-password" className="auth-link">
              Forgot Password?
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
            Your Health,
            <br />
            Our <em>Priority</em>
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
