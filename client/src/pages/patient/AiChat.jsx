import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Trash2,
  Bot,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import PatientNavbar from "./components/PatientNavbar";

// ── Config ─────────────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ── Suggested questions ────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { emoji: "💊", text: "What does paracetamol do?" },
  { emoji: "🩺", text: "When should I see a doctor?" },
  { emoji: "📋", text: "How to prepare for a blood test?" },
  { emoji: "🥗", text: "Foods that help lower blood pressure?" },
];

const SYSTEM_PROMPT = `You are HealthBot, a friendly and caring AI health assistant integrated into CareLine360 — a healthcare management platform for patients.

Your role:
- Help patients understand medical terms, prescriptions, diagnoses, and lab results in simple, easy-to-understand language
- Provide general health information, wellness tips, and lifestyle advice
- Explain medication purposes, common side effects, and precautions in plain language
- Help patients prepare questions for their doctor visits
- Offer first-aid guidance and when to seek emergency care

Rules:
- Always use a warm, empathetic, and reassuring tone — you're talking to patients, not doctors
- Keep medical jargon to a minimum; when you must use it, explain it simply
- Use bullet points, numbered steps, and emojis where helpful for readability
- Always include a disclaimer: remind patients to consult their doctor for personalized medical advice
- NEVER diagnose conditions or prescribe medication — you provide general health information only
- If someone describes a medical emergency, urge them to call emergency services immediately
- Keep responses concise but thorough — patients appreciate clear, actionable information
- Be culturally sensitive and inclusive in your responses`;

// ── Lightweight markdown → JSX renderer ────────────────────────────────────────
function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let key = 0;
  let inCode = false;
  let codeLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        inCode = false;
        elements.push(
          <pre
            key={key++}
            className="bg-gray-900 text-green-300 text-xs rounded-lg p-3 my-2 overflow-x-auto font-mono leading-relaxed"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={key++} className="font-bold text-gray-800 text-sm mt-2 mb-0.5">
          {inlineFormat(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={key++} className="font-bold text-gray-900 text-sm mt-2 mb-1">
          {inlineFormat(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h2 key={key++} className="font-bold text-gray-900 text-base mt-2 mb-1">
          {inlineFormat(line.slice(2))}
        </h2>
      );
    } else if (line.match(/^[-*+] /)) {
      elements.push(
        <li key={key++} className="ml-3 list-none flex gap-1.5 items-start">
          <span className="text-gray-400 mt-0.5 shrink-0">•</span>
          <span>{inlineFormat(line.slice(2))}</span>
        </li>
      );
    } else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)[1];
      elements.push(
        <li key={key++} className="ml-3 list-none flex gap-1.5 items-start">
          <span className="text-gray-500 font-semibold shrink-0 min-w-[1.25rem]">
            {num}.
          </span>
          <span>{inlineFormat(line.replace(/^\d+\. /, ""))}</span>
        </li>
      );
    } else if (line.match(/^---+$/)) {
      elements.push(<hr key={key++} className="my-2 border-gray-200" />);
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1.5" />);
    } else {
      elements.push(
        <p key={key++} className="leading-relaxed">
          {inlineFormat(line)}
        </p>
      );
    }
  }

  return elements;
}

function inlineFormat(text) {
  const parts = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|`(.+?)`)/g;
  let last = 0;
  let match;
  let k = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={k++} className="font-bold italic">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<strong key={k++} className="font-semibold">{match[3]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={k++}>{match[4]}</em>);
    } else if (match[5]) {
      parts.push(<em key={k++}>{match[5]}</em>);
    } else if (match[6]) {
      parts.push(
        <code key={k++} className="bg-gray-100 text-gray-700 text-xs px-1 py-0.5 rounded font-mono">
          {match[6]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

// ── Typing indicator ────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-end gap-1 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full bg-gray-400"
          animate={{ y: [0, -5, 0] }}
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
}

// ── Copy button ─────────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 shrink-0"
      title="Copy"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3 text-gray-400" />
      )}
    </button>
  );
}

// ── Message bubble ──────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center mt-0.5">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div
        className={`group max-w-[80%] relative ${isUser ? "items-end" : "items-start"} flex flex-col`}
      >
        <div
          className={`text-sm rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? "bg-gray-900 text-white rounded-br-sm"
              : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
          }`}
        >
          {isUser ? (
            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="space-y-0.5 text-sm">{renderMarkdown(msg.content)}</div>
          )}
        </div>
        {!isUser && (
          <div className="flex justify-end mt-0.5 pr-1">
            <CopyBtn text={msg.content} />
          </div>
        )}
        <span className="text-[10px] text-gray-400 mt-0.5 px-1">{msg.time}</span>
      </div>
      {isUser && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mt-0.5 text-xs font-bold text-gray-600">
          You
        </div>
      )}
    </motion.div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────────
export default function AiChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const historyRef = useRef([]);

  const now = () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcome = {
        role: "assistant",
        content:
          "Hello! 👋 I'm **HealthBot**, your AI health assistant.\n\nI can help you with:\n- 💊 Understanding your **prescriptions & medications**\n- 📋 Explaining **lab results & diagnoses**\n- 🩺 General **health & wellness** questions\n- 🏥 Knowing **when to see a doctor**\n\n⚠️ *I provide general health information only. Always consult your doctor for personalized medical advice.*\n\nHow can I help you today?",
        time: now(),
        id: "welcome",
      };
      setMessages([welcome]);
    }
  }, []);

  const sendMessage = useCallback(
    async (overrideText) => {
      const text = (overrideText ?? input).trim();
      if (!text || loading) return;

      setInput("");
      setError(null);

      const userMsg = {
        role: "user",
        content: text,
        time: now(),
        id: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      const apiMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...historyRef.current.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
        { role: "user", content: text },
      ];

      const body = {
        model: GROQ_MODEL,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1024,
      };

      try {
        const res = await fetch(GROQ_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `API error ${res.status}`);
        }

        const data = await res.json();
        const replyText =
          data?.choices?.[0]?.message?.content ||
          "I'm sorry, I couldn't generate a response. Please try again.";

        const assistantMsg = {
          role: "assistant",
          content: replyText,
          time: now(),
          id: Date.now() + 1,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        historyRef.current = [
          ...historyRef.current,
          { role: "user", content: text },
          { role: "assistant", content: replyText },
        ];

        if (historyRef.current.length > 40) {
          historyRef.current = historyRef.current.slice(-40);
        }
      } catch (err) {
        setError(err.message || "Failed to reach AI. Check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [input, loading]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    historyRef.current = [];
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <PatientNavbar />

      <motion.div
        className="max-w-4xl mx-auto px-5 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div
          className="bg-white rounded-3xl shadow-sm ring-1 ring-gray-100 overflow-hidden flex flex-col"
          style={{ height: "calc(100vh - 200px)" }}
        >
          {/* ── Header ─────────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900 text-sm">AI Medical Explanation</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-gray-500 text-xs">Online</span>
                </div>
                <p className="text-gray-400 text-xs">
                  AI Health Assistant · CareLine360
                </p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* ── Messages ────────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 scroll-smooth">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Suggestion chips */}
            <AnimatePresence>
              {messages.length <= 1 && !loading && (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="pt-2 pb-2"
                >
                  <p className="text-[10px] text-gray-400 mb-2 px-1 font-medium uppercase tracking-wide">
                    Suggested questions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        onClick={() => sendMessage(s.text)}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm cursor-pointer"
                      >
                        <span>{s.emoji}</span>
                        <span>{s.text}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading indicator */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2.5 items-end"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-red-700 text-xs"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>

          {/* ── Input area ──────────────────────────────────────────────────────── */}
          <div className="shrink-0 bg-white border-t border-gray-100 px-4 py-4">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 100) + "px";
                }}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask me anything about your health…"
                disabled={loading}
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-colors leading-relaxed disabled:opacity-60 max-h-[100px] overflow-y-auto"
                style={{ height: "44px" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="h-11 w-11 shrink-0 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-sm hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
                title="Send (Enter)"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              For general health info only · Always consult your doctor · Press{" "}
              <kbd className="px-1 py-0.5 rounded bg-gray-100 font-mono text-[9px]">
                Enter
              </kbd>{" "}
              to send
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}