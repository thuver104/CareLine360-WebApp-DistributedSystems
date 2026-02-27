
/**
 * AIChatWidget.jsx
 * Floating AI chatbot for the CareLine360 Doctor Dashboard.
 * Powered by Google Gemini 1.5 Flash.
 * Renders only inside DashboardLayout (doctor portal only).
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Trash2,
  Bot,
  Sparkles,
  ChevronDown,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

// ── Config ─────────────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ── Suggested questions shown after the welcome message ────────────────────
const SUGGESTIONS = [
  { emoji: "💊", text: "Common drug interactions to watch for?" },
  { emoji: "🪠", text: "Differential diagnosis for chest pain?" },
  { emoji: "🩺", text: "Antibiotic choice for community-acquired pneumonia?" },
  { emoji: "🧠", text: "Signs of sepsis and initial management?" },
  { emoji: "📄", text: "ICD-10 code for type 2 diabetes with CKD?" },
  { emoji: "💚", text: "Normal cardiac enzyme ranges and significance?" },
  { emoji: "🔬", text: "How to interpret a CBC with differential?" },
  { emoji: "🚑", text: "ACLS protocol for ventricular fibrillation?" },
];

const SYSTEM_PROMPT = `You are MedBot, an AI medical assistant exclusively integrated into CareLine360— a healthcare management platform for licensed doctors. 

Your role:
- Answer medical, clinical, pharmacological, diagnostic, and treatment questions professionally and concisely
- Assist doctors with drug dosages, interactions, differential diagnoses, and clinical guidelines
- Summarise medical research or explain complex conditions clearly
- Help with documentation phrasing, ICD codes, or clinical notes when asked
- Always recommend professional judgment and refer to latest clinical guidelines

Rules:
- Always maintain a professional, clinical tone
- Keep responses structured: use bullet points or numbered steps where applicable
- If a question is outside the medical/healthcare domain, politely decline and redirect to medical topics
- Never provide advice to patients — your user is always a licensed DOCTOR
- Do not diagnose the doctor's personal conditions
- Begin every first response with a brief acknowledgment of the doctor's question`;

// ── Lightweight markdown → JSX renderer ────────────────────────────────────────
function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let key = 0;
  let inCode = false;
  let codeLines = [];
  let codeLanguage = "";

  const flush = () => {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLanguage = line.slice(3).trim();
        codeLines = [];
      } else {
        inCode = false;
        elements.push(
          <pre
            key={key++}
            className="bg-gray-900 text-green-300 text-xs rounded-lg p-3 my-2 overflow-x-auto font-mono leading-relaxed"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>,
        );
        codeLines = [];
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h4
          key={key++}
          className="font-bold text-teal-600 dark:text-teal-400 text-sm mt-2 mb-0.5"
        >
          {inlineFormat(line.slice(4))}
        </h4>,
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3
          key={key++}
          className="font-bold text-teal-700 dark:text-teal-300 text-sm mt-2 mb-1"
        >
          {inlineFormat(line.slice(3))}
        </h3>,
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h2
          key={key++}
          className="font-bold text-teal-800 dark:text-teal-200 text-base mt-2 mb-1"
        >
          {inlineFormat(line.slice(2))}
        </h2>,
      );
    }
    // Bullet list
    else if (line.match(/^[-*+] /)) {
      elements.push(
        <li key={key++} className="ml-3 list-none flex gap-1.5 items-start">
          <span className="text-teal-500 mt-0.5 shrink-0">•</span>
          <span>{inlineFormat(line.slice(2))}</span>
        </li>,
      );
    }
    // Numbered list
    else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)[1];
      elements.push(
        <li key={key++} className="ml-3 list-none flex gap-1.5 items-start">
          <span className="text-teal-500 font-semibold shrink-0 min-w-[1.25rem]">
            {num}.
          </span>
          <span>{inlineFormat(line.replace(/^\d+\. /, ""))}</span>
        </li>,
      );
    }
    // Horizontal rule
    else if (line.match(/^---+$/)) {
      elements.push(
        <hr
          key={key++}
          className="my-2 border-gray-200 dark:border-white/10"
        />,
      );
    }
    // Empty line → spacer
    else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1.5" />);
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={key++} className="leading-relaxed">
          {inlineFormat(line)}
        </p>,
      );
    }
  }

  return elements;
}

function inlineFormat(text) {
  // Bold + italic combined: ***text***
  // Bold: **text**
  // Italic: *text* or _text_
  // Inline code: `code`
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
      parts.push(
        <strong key={k++} className="font-bold italic">
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      parts.push(
        <strong key={k++} className="font-semibold">
          {match[3]}
        </strong>,
      );
    } else if (match[4]) {
      parts.push(<em key={k++}>{match[4]}</em>);
    } else if (match[5]) {
      parts.push(<em key={k++}>{match[5]}</em>);
    } else if (match[6]) {
      parts.push(
        <code
          key={k++}
          className="bg-gray-100 dark:bg-white/10 text-teal-700 dark:text-teal-300 text-xs px-1 py-0.5 rounded font-mono"
        >
          {match[6]}
        </code>,
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
          className="block h-2 w-2 rounded-full bg-teal-400"
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
      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
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
      className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mt-0.5">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div
        className={`group max-w-[82%] relative ${isUser ? "items-end" : "items-start"} flex flex-col`}
      >
        <div
          className={`text-sm rounded-2xl px-3.5 py-2.5 shadow-sm ${
            isUser
              ? "bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-br-sm"
              : "bg-white dark:bg-white/8 border border-gray-100 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-bl-sm"
          }`}
        >
          {isUser ? (
            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="space-y-0.5 text-sm">
              {renderMarkdown(msg.content)}
            </div>
          )}
        </div>
        {!isUser && (
          <div className="flex justify-end mt-0.5 pr-1">
            <CopyBtn text={msg.content} />
          </div>
        )}
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 px-1">
          {msg.time}
        </span>
      </div>
      {isUser && (
        <div className="shrink-0 h-7 w-7 rounded-full bg-gray-200 dark:bg-white/15 flex items-center justify-center mt-0.5 text-xs font-bold text-gray-600 dark:text-gray-300">
          Dr
        </div>
      )}
    </motion.div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────────
export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const historyRef = useRef([]); // Gemini conversation history

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  // Welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcome = {
        role: "assistant",
        content:
          "Hello, Doctor! 👋 I'm **MedBot**, your AI medical assistant powered by Gemini.\n\nI can help with:\n- Differential diagnoses & clinical decisions\n- Drug dosages & interactions\n- Clinical guidelines & protocols\n- Medical terminology & documentation\n\nWhat can I assist you with today?",
        time: now(),
        id: "welcome",
      };
      setMessages([welcome]);
    }
  }, [open]);

  const now = () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

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

      // Build OpenAI-compatible message history for OpenRouter
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...historyRef.current.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
        { role: "user", content: text },
      ];

      const body = {
        model: GROQ_MODEL,
        messages,
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

        // Update history for context continuity
        historyRef.current = [
          ...historyRef.current,
          { role: "user", content: text },
          { role: "assistant", content: replyText },
        ];

        // Keep history to last 20 turns to avoid token overflow
        if (historyRef.current.length > 40) {
          historyRef.current = historyRef.current.slice(-40);
        }

        // Badge if panel is closed
        if (!open) setUnread((n) => n + 1);
      } catch (err) {
        setError(err.message || "Failed to reach AI. Check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, open],
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
    <>
      {/* ── Floating FAB ─────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
        <AnimatePresence>
          {!open && unread > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-rose-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center absolute -top-1.5 -right-1.5 z-10 pointer-events-none"
            >
              {unread}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="relative h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center ring-4 ring-teal-500/20 focus:outline-none"
          title="MedBot – AI Medical Assistant"
        >
          {/* Pulsing ring */}
          <span className="absolute inset-0 rounded-full bg-teal-400 opacity-30 animate-ping pointer-events-none" />
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-6 w-6" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sparkles className="h-6 w-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Chat panel ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-24 right-6 z-[59] w-[370px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl dark:shadow-black/50 border border-gray-200 dark:border-white/10"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 shrink-0">
              <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-sm">MedBot</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-teal-100 text-xs">Online</span>
                </div>
                <p className="text-teal-200 text-[11px] truncate">
                  AI Medical Assistant · CareLine360
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 className="h-3.5 w-3.5 text-white/70" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors"
                  title="Close"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            {/* Gemini branding bar */}
            <div className="flex items-center justify-center gap-1.5 py-1 bg-gray-50 dark:bg-[#1a1f2e] border-b border-gray-100 dark:border-white/[0.06] shrink-0">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2Z"
                  fill="url(#gGrad)"
                />
                <defs>
                  <linearGradient
                    id="gGrad"
                    x1="2"
                    y1="2"
                    x2="22"
                    y2="22"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#4285F4" />
                    <stop offset="1" stopColor="#0d9488" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                Powered by Groq · Llama 3.3 70B
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50 dark:bg-[#111827] scroll-smooth">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {/* Suggestion chips – shown only when only the welcome message exists */}
              <AnimatePresence>
                {messages.length <= 1 && !loading && (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="pt-1 pb-2"
                  >
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2 px-1 font-medium uppercase tracking-wide">
                      Suggested questions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTIONS.map((s, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04, duration: 0.2 }}
                          onClick={() => sendMessage(s.text)}
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full border border-teal-200 dark:border-teal-700/50 bg-white dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-800/30 hover:border-teal-400 transition-colors shadow-sm cursor-pointer"
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
                    className="flex gap-2 items-end"
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-white dark:bg-white/8 border border-gray-100 dark:border-white/10 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
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
                    className="flex items-start gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/20 rounded-xl px-3 py-2 text-rose-700 dark:text-rose-400 text-xs"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="shrink-0 bg-white dark:bg-[#1a1f2e] border-t border-gray-100 dark:border-white/[0.06] px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-resize up to 5 rows
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 100) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask a medical question…"
                  disabled={loading}
                  className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-teal-400 dark:focus:border-teal-500 transition-colors leading-relaxed disabled:opacity-60 max-h-[100px] overflow-y-auto"
                  style={{ height: "40px" }}
                />
                <motion.button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-teal-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  title="Send (Enter)"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>
              <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-2">
                For licensed doctors only · Not for patient use · Press{" "}
                <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/10 font-mono text-[9px]">
                  Enter
                </kbd>{" "}
                to send
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
