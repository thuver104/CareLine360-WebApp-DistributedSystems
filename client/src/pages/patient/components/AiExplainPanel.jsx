import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../../../api/axios";

const ThinkingDots = ({ dotSize = 4 }) => {
  const s = `${dotSize}px`;
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="rounded-full bg-black"
          style={{ width: s, height: s }}
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default function AiExplainPanel({ initialText = "" }) {
  const [text, setText] = useState(initialText);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);

  // Full response from API
  const [explanation, setExplanation] = useState("");

  // What we display with typewriter effect
  const [typed, setTyped] = useState("");

  const [error, setError] = useState("");

  // Controls
  const TYPE_SPEED_MS = 18; // lower = faster
  const intervalRef = useRef(null);

  // Typewriter effect when explanation changes
  useEffect(() => {
    // clear any previous typing
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!explanation) {
      setTyped("");
      return;
    }

    setTyped("");
    let i = 0;

    intervalRef.current = setInterval(() => {
      i += 1;
      setTyped(explanation.slice(0, i));

      if (i >= explanation.length) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, TYPE_SPEED_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [explanation]);

  const onExplain = async () => {
    setError("");
    setExplanation("");
    setTyped("");

    if (!text.trim()) {
      setError("Please enter medical text.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/patients/me/ai-explain", {
        text,
        language,
      });

      setExplanation(res.data.explanation || "");
    } catch (e) {
      setError(e?.response?.data?.message || "AI request failed.");
    } finally {
      setLoading(false);
    }
  };

  const onClear = () => {
    setText("");
    setExplanation("");
    setTyped("");
    setError("");
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const typingInProgress = !!explanation && typed.length < explanation.length;

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold">AI Medical Explanation</h2>

        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={loading}
        >
          <option>English</option>
          <option>Tamil</option>
          <option>Sinhala</option>
        </select>
      </div>

      <textarea
        className="w-full border rounded-xl p-3 min-h-[140px] text-sm"
        placeholder="Paste prescription text, diagnosis, medicine names, ICD code…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={onExplain}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm disabled:opacity-60"
        >
          {loading ? "Explaining..." : "Explain"}
        </button>

        <button
          onClick={onClear}
          className="border px-4 py-2 rounded-xl text-sm disabled:opacity-60"
          disabled={loading}
        >
          Clear
        </button>

        {/* Optional: Skip animation button */}
        {explanation && typingInProgress && (
          <button
            onClick={() => setTyped(explanation)}
            className="ml-auto text-sm px-4 py-2 rounded-xl bg-gray-50 border hover:bg-gray-100"
          >
            Skip
          </button>
        )}
      </div>

      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 inline-flex items-center gap-3 bg-gray-50 border rounded-2xl px-4 py-3"
        >
          <span className="text-sm text-black">AI is thinking</span>
          <ThinkingDots />
        </motion.div>
      )}

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {/* Explanation with typewriter + cursor */}
      {!loading && explanation && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Explanation</div>

          <div className="text-sm whitespace-pre-wrap bg-gray-50 border rounded-xl p-3 leading-relaxed">
            {typed}
            {/* Blinking cursor while typing */}
            {typingInProgress && (
              <span className="inline-block w-[2px] h-[1em] bg-black align-[-2px] ml-1 animate-pulse" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}