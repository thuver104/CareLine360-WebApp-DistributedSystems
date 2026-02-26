import {useEffect, useState } from "react";
import { motion } from "framer-motion";

import PatientNavbar from "./components/PatientNavbar";
import AiExplainPanel from "./components/AiExplainPanel";

export default function AiChat() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const timer = setTimeout(() => {
    setLoading(false);
  }, 1200); // 1.2 seconds demo

  return () => clearTimeout(timer);
}, []);

  const Spinner = ({ size = 28 }) => (
    <div className="flex flex-col items-center justify-center py-12 min-h-[60vh] gap-4">
        <div
        className="rounded-full border-3 border-gray-200 border-t-black animate-spin"
        style={{ width: size, height: size }}
        aria-label="Loading"
        />

        <div className="text-sm text-gray-500 animate-pulse">
        Loading data...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <PatientNavbar />
      {loading ? (
        <Spinner size={38} />
        ) : (
      <motion.div
        className="max-w-6xl mx-auto px-5 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <AiExplainPanel />
      </motion.div>
      )}
    </div>
  );
}