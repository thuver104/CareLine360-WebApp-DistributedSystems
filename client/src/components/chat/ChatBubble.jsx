export default function ChatBubble({ message, senderRole }) {
  const roleLabel = senderRole === "doctor" ? "Doctor" : "Patient";

  return (
    <div className={`flex ${senderRole === "doctor" ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          senderRole === "doctor"
            ? "bg-green-600 text-white rounded-br-sm shadow-md"
            : "bg-blue-600 text-white rounded-bl-sm shadow-md"
        }`}
      >
        <p className="text-xs font-semibold mb-1 text-white/80">
          {roleLabel}
        </p>
        <p className="text-sm leading-6">{message.message}</p>
        <p className="text-xs mt-2 text-white/60">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
