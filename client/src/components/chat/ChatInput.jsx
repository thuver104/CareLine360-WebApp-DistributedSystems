import { useState } from "react";

export default function ChatInput({ onSend, onTyping, disabled, isTyping, typingUserRole }) {
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
    <div>
      {/* Show who is typing */}
      {isTyping && !disabled && (
        <div className="px-4 py-1 text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            <span className="ml-1">
              {typingUserRole === 'doctor' ? 'Doctor is typing...' : 'Patient is typing...'}
            </span>
          </span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex space-x-2 p-4 bg-white border-t border-gray-100">
        <input
          type="text"
          value={text}
          onChange={handleChange}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
}
