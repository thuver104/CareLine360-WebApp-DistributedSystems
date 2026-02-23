import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";
import { motion, AnimatePresence } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

const softPop = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
};

export default function PatientDashboard() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get("/patients/me");
        setMe(res.data);
      } catch (e) {
        setMsg(e.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.clear();
    window.location.href = "/login";
  };

  const score = me?.profileStrength?.score ?? 0;
  const missing = me?.profileStrength?.missing ?? [];


  const navItems = useMemo(
    () => [
      { label: "Overview", href: "/patient/dashboard" },
      { label: "Documents", href: "/patient/documents" },
      { label: "Medical History", href: "/patient/medical-history" },
      { label: "AI Chat", href: "/patient/messages" },
    ],
    []
  );

  const activePath = typeof window !== "undefined" ? window.location.pathname : "";

  // nice number animation without extra libs
  const ScoreNumber = ({ value }) => (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {value}
    </motion.span>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6fbff] to-white p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="h-16 rounded-3xl bg-white/70 shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <div className="mt-6 grid lg:grid-cols-12 gap-5">
            <motion.div
              className="lg:col-span-7 h-[520px] rounded-3xl bg-white shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            />
            <motion.div
              className="lg:col-span-5 h-[520px] rounded-3xl bg-white shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6fbff] to-white bg-[url('/')] bg-cover bg-center p-6">
      {/* Top Nav */}
      <div className="sticky top-0 z-10 backdrop-blur bg-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
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

          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            {navItems.map((item) => {
              const isActive = activePath === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={
                    "relative py-1 transition-colors " +
                    (isActive ? "text-gray-900 font-medium" : "hover:text-gray-900")
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

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <button className="w-9 h-9 rounded-full bg-white shadow-xl grid place-items-center transition-transform hover:scale-[1.03] active:scale-[0.98]">
              <span className="text-lg">🔔</span>
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

        {/* Mobile nav */}
        <div className="md:hidden border-t bg-white/60">
          <div className="max-w-6xl mx-auto px-5 py-2 flex gap-2 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = activePath === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={
                    "whitespace-nowrap px-3 py-2 rounded-full text-sm border transition " +
                    (isActive
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 active:scale-[0.98]")
                  }
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page */}
      <div className="max-w-7xl mx-auto px-5 py-6">
        <AnimatePresence>
          {msg && (
            <motion.div
              className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100"
              variants={softPop}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {msg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-12 gap-5">
          {/* LEFT HERO AREA */}
          <div className="lg:col-span-7">
            <motion.div
              className="bg-white rounded-3xl shadow-sm p-6 overflow-hidden relative"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <motion.h1
                    className="text-4xl md:text-5xl font-semibold leading-tight text-gray-900"
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                  >
                    Overview
                  </motion.h1>
                  <motion.p
                    className="text-2xl md:text-3xl font-light text-gray-700 mt-1"
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={2}
                  >
                    Patient Management
                  </motion.p>

                  <motion.div
                    className="mt-4 text-sm text-gray-600"
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={3}
                  >
                    <span className="text-gray-500">User:</span>{" "}
                    <span className="font-medium">{me?.fullName || "Patient"}</span>{" "}
                    <span className="mx-2">•</span>
                    <span className="text-gray-500">Role:</span>{" "}
                    <span className="font-medium">{me?.role || "patient"}</span>{" "}
                    <span className="mx-2">•</span>
                    <span className="text-gray-500">Email verified:</span>{" "}
                    <span className={"font-medium " + (me?.isVerified ? "text-green-700" : "text-amber-700")}>
                      {me?.isVerified ? "Yes" : "No"}
                    </span>
                  </motion.div>
                </div>

                {/* Profile completion badge */}
                <motion.div
                  className="w-28 rounded-2xl bg-gray-50 border border-gray-100 p-4"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={2}
                >
                  <div className="text-xs text-gray-700/70">Profile completion</div>
                  <div className="mt-1 text-3xl font-bold text-gray-800">
                    <ScoreNumber value={score} />%
                  </div>

                  <div className="mt-3 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-2 bg-gray-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Hero image + floating quick actions */}
              <div className="mt-6 relative">
                <motion.div
                  className="rounded-3xl overflow-hidden bg-gray-50"
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.img
                    src='/img1.jpg'
                    alt="Patient dashboard"
                    className="w-full h-[360px] object-cover"
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </motion.div>

                {/* Floating: Documents */}
                <motion.a
                  href="/patient/documents"
                  className="absolute left-6 bottom-6 bg-transparent backdrop-blur rounded-2xl shadow-sm p-4 w-[230px] group"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-xs text-white">Quick action</div>
                  <div className="mt-1 font-semibold text-gray-300 flex items-center justify-between">
                    Upload Documents
                    <span className="text-gray-600 group-hover:text-white transition">↗</span>
                  </div>
                  <div className="text-sm text-gray-400">Medical reports / prescriptions</div>
                </motion.a>

                {/* Floating: AI chat */}
                <motion.a
                  href="/patient/messages"
                  className="absolute right-6 bottom-6 bg-transparent backdrop-blur rounded-2xl shadow-sm p-4 w-[190px] group"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-xs text-white">Need help?</div>
                  <div className="mt-1 font-semibold text-gray-300 flex items-center justify-between">
                    Ask AI Chat
                    <span className="text-gray-600 group-hover:text-white transition">↗</span>
                  </div>
                  <div className="text-sm text-gray-400">General guidance</div>
                </motion.a>
              </div>

              {/* Missing list */}
              <AnimatePresence>
                {missing.length > 0 && (
                  <motion.div
                    className="mt-5 rounded-2xl bg-gray-50 p-4"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="text-sm font-semibold text-gray-900">Complete your profile</div>
                    <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                      {missing.slice(0, 4).map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                    <div className="mt-3">
                      <a
                        href="/patient/profile"
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
                      >
                        Update profile <span>→</span>
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* RIGHT SIDE CARDS */}
          <div className="lg:col-span-5 space-y-5">
            {/* Search + AI CTA */}
            <motion.div
              className="bg-white rounded-3xl shadow-sm p-5"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-50 transition focus-within:ring-2 focus-within:ring-blue-200">
                  <span className="text-gray-400">🔎</span>
                  <input
                    className="w-full bg-transparent outline-none text-sm"
                    placeholder="Search documents, history..."
                  />
                </div>
                <a
                  href="/patient/messages"
                  className="px-5 py-3 rounded-2xl bg-black font-medium text-white shadow-sm hover:opacity-95 transition active:scale-[0.98]"
                >
                  AI Chat ↗
                </a>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Tip: Keep your profile updated to get better AI guidance suggestions.
              </div>
            </motion.div>

            {/* Quick nav cards */}
            <div className="grid sm:grid-cols-2 gap-5">
              <motion.a
                href="/patient/documents"
                className="bg-white rounded-3xl shadow-sm p-5 hover:shadow-md transition"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                whileHover={{ y: -2 }}
              >
                <div className="font-semibold text-gray-900">Documents</div>
                <div className="text-sm text-gray-500 mt-1">Upload & manage reports</div>
                <div className="mt-6 text-3xl font-semibold text-gray-900">My Files</div>
                <div className="mt-4 text-sm text-blue-700 font-medium">Open →</div>
              </motion.a>

              <motion.a
                href="/patient/medical-history"
                className="bg-white rounded-3xl shadow-sm p-5 hover:shadow-md transition"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
                whileHover={{ y: -2 }}
              >
                <div className="font-semibold text-gray-900">Medical History</div>
                <div className="text-sm text-gray-500 mt-1">View past entries</div>
                <div className="mt-6 text-3xl font-semibold text-gray-900">Timeline</div>
                <div className="mt-4 text-sm text-blue-700 font-medium">View →</div>
              </motion.a>
            </div>

            {/* Profile card */}
            <motion.div
              className="bg-white rounded-3xl shadow-sm p-5"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-900">Profile</div>
                <a href="/patient/profile" className="text-sm text-blue-700 hover:underline">
                  Edit →
                </a>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">Patient ID</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {me?.patientId || "—"}
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900 truncate">
                    {me?.email || "—"}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AI safety card (dark) */}
            <motion.div
              className="rounded-3xl overflow-hidden shadow-sm bg-black text-white relative"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
            >
              <div className="p-6">
                <div className="text-xs text-white/70">Message (AI Chat)</div>
                <div className="mt-2 text-2xl font-semibold">Get safe guidance</div>
                <div className="mt-2 text-sm text-white/70 max-w-sm">
                  AI provides general health information only — not a diagnosis. For emergencies,
                  contact a doctor or hospital.
                </div>

                <div className="mt-6 flex gap-3">
                  <a
                    href="/patient/messages"
                    className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-sm hover:bg-white/15 transition"
                  >
                    Open AI Chat
                  </a>
                  <a
                    href="/patient/documents"
                    className="px-4 py-2 rounded-2xl bg-white text-gray-900 text-sm font-medium hover:opacity-95 transition"
                  >
                    Upload Document
                  </a>
                </div>
              </div>

              <div className="absolute right-4 top-4 w-10 h-10 rounded-full bg-white/10 border border-white/15 grid place-items-center">
                ↗
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
