import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";
import { motion } from "framer-motion";

export default function PatientNavbar() {
  const [me, setMe] = useState(null);

  const navItems = useMemo(
    () => [
      { label: "Overview", href: "/patient/dashboard" },
      { label: "Documents", href: "/patient/documents" },
      { label: "Medical History", href: "/patient/medical-history" },
      { label: "AI Chat", href: "/patient/messages" },
    ],
    []
  );

  const activePath =
    typeof window !== "undefined" ? window.location.pathname : "";

  const loadMe = async () => {
    try {
      const res = await api.get("/patients/me");
      setMe(res.data || null);
    } catch {
      setMe(null);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.clear();
    window.location.href = "/login";
  };

//   const avatar = me?.avatarUrl;

  return (
    <div className="sticky top-0 z-10 backdrop-blur bg-white">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="w-9 h-9 rounded-full bg-gray-600/10 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-black" />
          </div>
          <span className="font-semibold text-gray-900">CareLine360</span>
        </motion.div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          {navItems.map((item) => {
            const isActive = activePath === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={
                  "relative py-1 transition-colors " +
                  (isActive
                    ? "text-gray-900 font-medium"
                    : "hover:text-gray-900")
                }
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-0 right-0 -bottom-2 h-[2px] bg-gray-900 rounded-full"
                  />
                )}
              </a>
            );
          })}
        </div>

        {/* Right Section */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <button className="w-9 h-9 rounded-full bg-white shadow-xl grid place-items-center transition-transform hover:scale-[1.03] active:scale-[0.98]">
            🔔
          </button>

          <a
            href="/patient/profile"
            className="w-10 h-10 rounded-full overflow-hidden shadow-xl transition-transform hover:scale-[1.05] active:scale-[0.98] border border-gray-200"
            title="Profile"
          >
            {me?.avatarUrl ? (
              <img
                src={me.avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm">
                👤
              </div>
            )}
          </a>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-full bg-black text-white text-sm shadow-xl hover:opacity-95 transition active:scale-[0.98]"
          >
            Logout
          </button>
        </motion.div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t bg-white/60">
        <div className="max-w-6xl mx-auto px-5 py-2 flex gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activePath === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={
                  "whitespace-nowrap px-3 py-2 rounded-full text-sm border " +
                  (isActive
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200")
                }
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
