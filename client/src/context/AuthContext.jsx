import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { setAuth as storageSetAuth, clearAuth as storageClearAuth } from "../auth/authStorage";
import { api } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const restoreFromStorage = useCallback(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Rehydrate basic user info from storage
    const role = localStorage.getItem("role");
    const fullName = localStorage.getItem("fullName");
    const userId = localStorage.getItem("userId");

    setUser({ id: userId, role, fullName });
    setLoading(false);
  }, []);

  useEffect(() => {
    restoreFromStorage();

    const onStorage = (e) => {
      if (e.key === "accessToken") {
        // token added/removed in another tab — rehydrate
        restoreFromStorage();
      }
      if (e.key === "fullName" || e.key === "role" || e.key === "userId") {
        restoreFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [restoreFromStorage]);

  const login = ({ accessToken, refreshToken, user }) => {
    // persist tokens & basic user info
    storageSetAuth({ accessToken, refreshToken, user });
    setUser({ id: user.id, role: user.role, fullName: user.fullName });
  };

  const logout = () => {
    storageClearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
