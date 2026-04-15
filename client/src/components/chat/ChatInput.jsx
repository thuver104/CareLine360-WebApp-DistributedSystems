import { useState } from "react";
import { Send } from "lucide-react";

export default function ChatInput({ onSend, onTyping, disabled }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  const handleChange = (e) => {
    setText(e.target.value);
    // Trigger typing indicator
    if (onTyping) {
      onTyping();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 bg-white dark:bg-[var(--glass-bg)] border-t border-gray-100 dark:border-white/5"
    >
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 h-10 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl px-3.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] disabled:opacity-50 transition"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="h-10 w-10 shrink-0 flex items-center justify-center bg-[#0d9488] text-white rounded-xl hover:bg-[#0b7c72] active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
