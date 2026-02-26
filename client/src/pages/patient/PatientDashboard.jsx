import { useEffect, useState } from "react";
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
  const [me, setMe]           = useState(null);
  const [msg, setMsg]         = useState("");

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

  const score   = me?.profileStrength?.score   ?? 0;
  const missing = me?.profileStrength?.missing ?? [];

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
      <div className="space-y-5">
        <motion.div
          className="h-16 rounded-3xl bg-white/70 dark:bg-white/5 shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
        <div className="grid lg:grid-cols-12 gap-5">
          <motion.div
            className="lg:col-span-7 h-[520px] rounded-3xl bg-white dark:bg-slate-900 shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          />
          <motion.div
            className="lg:col-span-5 h-[520px] rounded-3xl bg-white dark:bg-slate-900 shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AnimatePresence>
        {msg && (
          <motion.div
            className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/30"
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
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-slate-900/50 p-6 overflow-hidden relative border border-transparent dark:border-slate-800"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <motion.h1
                  className="text-4xl md:text-5xl font-semibold leading-tight text-gray-900 dark:text-white"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                >
                  Overview
                </motion.h1>
                <motion.p
                  className="text-2xl md:text-3xl font-light text-gray-700 dark:text-gray-300 mt-1"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={2}
                >
                  Patient Management
                </motion.p>

                <motion.div
                  className="mt-4 text-sm text-gray-600 dark:text-gray-400"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={3}
                >
                  <span className="text-gray-500 dark:text-gray-500">User:</span>{" "}
                  <span className="font-medium text-gray-900 dark:text-white">{me?.fullName || "Patient"}</span>{" "}
                  <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-gray-500 dark:text-gray-500">Role:</span>{" "}
                  <span className="font-medium text-gray-900 dark:text-white">{me?.role || "patient"}</span>{" "}
                  <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-gray-500 dark:text-gray-500">Email verified:</span>{" "}
                  <span className={"font-medium " + (me?.isVerified ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400")}>
                    {me?.isVerified ? "Yes" : "No"}
                  </span>
                </motion.div>
              </div>

              {/* Profile completion badge */}
              <motion.div
                className="w-28 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-4"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400">Profile completion</div>
                <div className="mt-1 text-3xl font-bold text-gray-800 dark:text-white">
                  <ScoreNumber value={score} />%
                </div>

                <div className="mt-3 h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-2 bg-teal-500 rounded-full"
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
                className="rounded-3xl overflow-hidden bg-gray-50 dark:bg-slate-800"
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.img
                  src="/img1.jpg"
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
                className="absolute left-6 bottom-6 bg-black/40 dark:bg-black/60 backdrop-blur rounded-2xl shadow-sm p-4 w-[230px] group"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-xs text-white/70">Quick action</div>
                <div className="mt-1 font-semibold text-white flex items-center justify-between">
                  Upload Documents
                  <span className="text-white/60 group-hover:text-white transition">↗</span>
                </div>
                <div className="text-sm text-white/60">Medical reports / prescriptions</div>
              </motion.a>

              {/* Floating: AI chat */}
              <motion.a
                href="/patient/messages"
                className="absolute right-6 bottom-6 bg-black/40 dark:bg-black/60 backdrop-blur rounded-2xl shadow-sm p-4 w-[190px] group"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-xs text-white/70">Need help?</div>
                <div className="mt-1 font-semibold text-white flex items-center justify-between">
                  Ask AI Chat
                  <span className="text-white/60 group-hover:text-white transition">↗</span>
                </div>
                <div className="text-sm text-white/60">General guidance</div>
              </motion.a>
            </div>

            {/* Missing list */}
            <AnimatePresence>
              {missing.length > 0 && (
                <motion.div
                  className="mt-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="text-sm font-semibold text-amber-900 dark:text-amber-300">Complete your profile</div>
                  <ul className="mt-2 text-sm text-amber-800 dark:text-amber-400 list-disc pl-5 space-y-1">
                    {missing.slice(0, 4).map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    <a
                      href="/patient/profile"
                      className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline"
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
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-slate-900/50 p-5 border border-transparent dark:border-slate-800"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 transition focus-within:ring-2 focus-within:ring-teal-200 dark:focus-within:ring-teal-800">
                <span className="text-gray-400">🔎</span>
                <input
                  className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Search documents, history..."
                />
              </div>
              <a
                href="/patient/messages"
                className="px-5 py-3 rounded-2xl bg-teal-600 dark:bg-teal-700 font-medium text-white shadow-sm hover:bg-teal-700 dark:hover:bg-teal-600 transition active:scale-[0.98]"
              >
                AI Chat ↗
              </a>
            </div>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Tip: Keep your profile updated to get better AI guidance suggestions.
            </div>
          </motion.div>

          {/* Quick nav cards */}
          <div className="grid sm:grid-cols-2 gap-5">
            <motion.a
              href="/patient/documents"
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-slate-900/50 p-5 hover:shadow-md dark:hover:shadow-slate-900 transition border border-transparent dark:border-slate-800 hover:border-teal-100 dark:hover:border-teal-900/50"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              whileHover={{ y: -2 }}
            >
              <div className="font-semibold text-gray-900 dark:text-white">Documents</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload & manage reports</div>
              <div className="mt-6 text-3xl font-semibold text-gray-900 dark:text-white">My Files</div>
              <div className="mt-4 text-sm text-teal-600 dark:text-teal-400 font-medium">Open →</div>
            </motion.a>

            <motion.a
              href="/patient/medical-history"
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-slate-900/50 p-5 hover:shadow-md dark:hover:shadow-slate-900 transition border border-transparent dark:border-slate-800 hover:border-teal-100 dark:hover:border-teal-900/50"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              whileHover={{ y: -2 }}
            >
              <div className="font-semibold text-gray-900 dark:text-white">Medical History</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">View past entries</div>
              <div className="mt-6 text-3xl font-semibold text-gray-900 dark:text-white">Timeline</div>
              <div className="mt-4 text-sm text-teal-600 dark:text-teal-400 font-medium">View →</div>
            </motion.a>
          </div>

          {/* Profile card */}
          <motion.div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-slate-900/50 p-5 border border-transparent dark:border-slate-800"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-white">Profile</div>
              <a href="/patient/profile" className="text-sm text-teal-600 dark:text-teal-400 hover:underline">
                Edit →
              </a>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Patient ID</div>
                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {me?.patientId || "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {me?.email || "—"}
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI safety card (dark) */}
          <motion.div
            className="rounded-3xl overflow-hidden shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white relative border border-slate-700/50"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
          >
            <div className="p-6">
              <div className="text-xs text-white/60">Message (AI Chat)</div>
              <div className="mt-2 text-2xl font-semibold">Get safe guidance</div>
              <div className="mt-2 text-sm text-white/60 max-w-sm">
                AI provides general health information only — not a diagnosis. For emergencies,
                contact a doctor or hospital.
              </div>

              <div className="mt-6 flex gap-3">
                <a
                  href="/patient/messages"
                  className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-sm hover:bg-white/20 transition"
                >
                  Open AI Chat
                </a>
                <a
                  href="/patient/documents"
                  className="px-4 py-2 rounded-2xl bg-teal-500 text-white text-sm font-medium hover:bg-teal-400 transition"
                >
                  Upload Document
                </a>
              </div>
            </div>

            <div className="absolute right-4 top-4 w-10 h-10 rounded-full bg-white/10 border border-white/15 grid place-items-center text-white/60">
              ↗
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
