import { Navigate, Outlet } from "react-router-dom";
import { getRole, hasToken } from "../auth/authStorage";

export default function ProtectedRoute({ allowedRoles = [] }) {
  if (!hasToken()) return <Navigate to="/login" replace />;
  const role = getRole();
  if (allowedRoles.length && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
