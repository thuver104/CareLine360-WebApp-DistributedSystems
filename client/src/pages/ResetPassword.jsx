import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/axios";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import logo from "../assets/logo.png";
import forgotImg from "../assets/images/forgotten_password_image.png";

import "./Auth.css";

export default function ResetPassword() {
  const nav = useNavigate();
  const loc = useLocation();
  const [identifier, setIdentifier] = useState(loc.state?.identifier || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = async () => {
    setMsg("");
    setMsgType("");

    if (!identifier.trim()) {
      setMsgType("error");
      setMsg("Email is required");
      return;
    }
    if (!otp) {
      setMsgType("error");
      setMsg("OTP is required");
      return;
    }
    if (!newPassword) {
      setMsgType("error");
      setMsg("New password is required");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/password/reset", {
        identifier,
        otp,
        newPassword,
      });
      setMsgType("success");
      setMsg(res.data.message || "Password reset successful!");
      setTimeout(() => nav("/login"), 1000);
    } catch (e) {
      setMsgType("error");
      setMsg(e.response?.data?.message || "Reset failed");
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
    <div className="auth-page auth-page--reversed">
      <div className="auth-noise" />

      {/* ═══════ FORM PANEL (Right side due to reversed) ═══════ */}
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
          <span className="auth-overline">Account Recovery</span>
          <h1 className="auth-title">
            Reset <span className="auth-title-accent">Password</span>
          </h1>
          <p className="auth-subtitle">
            Enter the OTP and choose a new password
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
          <div>
            {/* Email */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="rp-email">
                Email
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="rp-email"
                  className="auth-input"
                  placeholder="Your email address"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
                <Mail size={15} strokeWidth={1.5} className="auth-input-icon" />
              </div>
            </div>

            {/* OTP */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="rp-otp">
                OTP Code
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="rp-otp"
                  className="auth-input"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <KeyRound
                  size={15}
                  strokeWidth={1.5}
                  className="auth-input-icon"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="rp-newpw">
                New Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="rp-newpw"
                  className="auth-input"
                  placeholder="e.g., NewPass@1234"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            <button
              type="button"
              disabled={loading}
              onClick={reset}
              className="auth-submit-btn"
            >
              <span className="btn-slide-bg" />
              <span className="btn-text">
                {loading ? (
                  <>
                    <span className="auth-spinner" /> Resetting…
                  </>
                ) : (
                  <>
                    Reset Password <ArrowRight size={14} />
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">or</span>
            <span className="auth-divider-line" />
          </div>

          {/* Footer */}
          <div className="auth-footer-links auth-footer-links--center">
            <span className="auth-footer-text">Remember your password?</span>
            <Link to="/login" className="auth-link auth-link--accent">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ═══════ IMAGE PANEL (Left side due to reversed) ═══════ */}
      <div className="auth-image-panel auth-image-panel--centered">
        <div className="auth-float-circle auth-float-circle--1" />
        <div className="auth-float-circle auth-float-circle--2" />
        <div className="auth-float-circle auth-float-circle--3" />
        <div className="auth-img-glow auth-img-glow--center" />

        <motion.div
          className="auth-panel-overlay auth-panel-overlay--left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="auth-panel-overline">Secure Reset</p>
          <h2 className="auth-panel-title">
            New Password,
            <br />
            Fresh <em>Start</em>
          </h2>
        </motion.div>

        <motion.img
          src={forgotImg}
          alt="Secure lock"
          className="auth-hero-img auth-hero-img--centered"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
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
