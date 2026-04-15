import { useState } from "react";
import { api } from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Mail,
  ArrowRight,
} from "lucide-react";

import logo from "../assets/logo.png";
import forgotImg from "../assets/images/forgotten_password_image.png";

import "./Auth.css";

export default function ForgotPassword() {
  const nav = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType("");

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      setMsg("Email is required");
      setMsgType("error");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/password/forgot", {
        identifier: cleanIdentifier,
      });

      localStorage.setItem("resetIdentifier", cleanIdentifier);

      setMsg(res.data?.message || "OTP sent to your email");
      setMsgType("success");

      setTimeout(() => {
        nav("/reset-password", {
          state: { identifier: cleanIdentifier },
        });
      }, 700);
    } catch (err) {
      setMsg(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Failed to send OTP"
      );
      setMsgType("error");
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
            Forgot <span className="auth-title-accent">Password</span>
          </h1>
          <p className="auth-subtitle">
            Enter your email to receive an OTP for password reset
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
          <form onSubmit={sendOtp}>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="fp-identifier">
                Email or Phone
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="fp-identifier"
                  className="auth-input"
                  placeholder="Enter your email or phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
                <Mail size={15} strokeWidth={1.5} className="auth-input-icon" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              <span className="btn-slide-bg" />
              <span className="btn-text">
                {loading ? (
                  <>
                    <span className="auth-spinner" /> Sending…
                  </>
                ) : (
                  <>
                    Send OTP <ArrowRight size={14} />
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
          <p className="auth-panel-overline">Account Recovery</p>
          <h2 className="auth-panel-title">
            Secure Your
            <br />
            <em>Account</em>
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
