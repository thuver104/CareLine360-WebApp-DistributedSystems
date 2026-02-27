import { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";

export default function ChatWindow({ messages, currentUserId }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 bg-gradient-to-b from-slate-50 to-blue-50/30">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 font-medium">No messages yet</p>
          <p className="text-xs text-gray-300 mt-0.5">Start the conversation!</p>
        </div>
      )}
      {messages.map((msg) => (
        <ChatBubble
          key={msg._id}
          message={msg}
          isOwn={msg.senderId === currentUserId || msg.senderId?._id === currentUserId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
