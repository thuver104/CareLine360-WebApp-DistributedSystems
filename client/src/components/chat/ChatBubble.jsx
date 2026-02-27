export default function ChatBubble({ message, isOwn }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const isDoctor = message.senderRole === "doctor";
  const initials = isDoctor ? "Dr" : "Pt";

  return (
    <div className={`flex items-end gap-2.5 mb-5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm ${
            isDoctor
              ? "bg-gradient-to-br from-blue-400 to-indigo-500 text-white"
              : "bg-gradient-to-br from-teal-400 to-cyan-500 text-white"
          }`}
        >
          {initials}
        </div>
        <span className={`text-[10px] leading-none ${isOwn ? "text-blue-400" : "text-gray-400"}`}>
          {time}
        </span>
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[65%] px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
          isOwn
            ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-2xl rounded-br-md"
            : "bg-white text-gray-700 rounded-2xl rounded-bl-md ring-1 ring-gray-100"
        }`}
      >
        {message.message}
      </div>
    </div>
  );
}
