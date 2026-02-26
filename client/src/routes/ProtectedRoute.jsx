import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getRole, hasToken } from "../auth/authStorage";
import { getDoctorProfile } from "../api/doctorApi";

// These are pages within the doctor layout that the doctor can legitimately
// reach AFTER completing setup. They must never trigger a setup redirect.
const DASHBOARD_PATHS = ["/doctor/dashboard", "/doctor/profile"];

export default function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const token = hasToken();
  const role = getRole();

  const [profileChecked, setProfileChecked] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  // This ref ensures the API call only fires ONCE per login session.
  // Previously the effect depended on location.pathname, so every navigation
  // (e.g. dashboard → profile) triggered a fresh getDoctorProfile() call.
  // A race condition or momentary 404 caused needsSetup=true immediately
  // after setup, looping the user back to /doctor/setup.
  const checkedRef = useRef(false);

  useEffect(() => {
    if (role !== "doctor" || !token) {
      // Non-doctor roles or unauthenticated — nothing to check.
      setProfileChecked(true);
      return;
    }

    if (location.pathname === "/doctor/setup") {
      // While the doctor is actively completing setup:
      //  • Clear needsSetup so the guard doesn't loop on departure.
      //  • Reset checkedRef so the profile is re-verified once they leave
      //    (confirming the newly-created profile actually exists).
      setNeedsSetup(false);
      checkedRef.current = false;
      setProfileChecked(true);
      return;
    }

    if (checkedRef.current) {
      // Profile already verified this navigation cycle — skip the API call.
      return;
    }

    // Verify the profile exists (runs once after login, and once after leaving
    // /doctor/setup so the newly-created profile is confirmed before rendering
    // the rest of the app).
    checkedRef.current = true;
    getDoctorProfile()
      .then(() => {
        setNeedsSetup(false);
      })
      .catch((err) => {
        // Only redirect to setup for a definitive 404 (profile not found).
        // Ignore 403, 401, and network errors to avoid spurious redirects.
        if (err?.response?.status === 404) {
          setNeedsSetup(true);
        }
      })
      .finally(() => setProfileChecked(true));
    // location.pathname is intentionally included so the check re-runs exactly
    // once when the doctor leaves /doctor/setup (checkedRef was reset above).
  }, [role, token, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Guards ──────────────────────────────────────────────────────────────────

  // Not logged in
  if (!token)
    return <Navigate to="/login" state={{ from: location }} replace />;

  // Role not allowed
  if (!allowedRoles.includes(role)) return <Navigate to="/" replace />;

  // Show a spinner only during the very first profile check (avoids flash)
  if (role === "doctor" && !profileChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Doctor hasn't completed setup — send them there
  if (
    role === "doctor" &&
    needsSetup &&
    location.pathname !== "/doctor/setup"
  ) {
    return <Navigate to="/doctor/setup" replace />;
  }

  return <Outlet />;
}
