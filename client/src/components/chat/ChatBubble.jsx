import { getInitials } from "../../utils/colors";

export default function ChatBubble({ message, senderRole, currentUserRole, doctorName }) {
  const isOwn = senderRole === currentUserRole;

  // Role label: "You" for own messages, doctor name or "Patient" for others
  let roleLabel;
  if (isOwn) {
    roleLabel = "You";
  } else if (senderRole === "doctor") {
    roleLabel = doctorName || "Doctor";
  } else {
    roleLabel = "Patient";
  }

  const msgText = message.message || message.text || "";
  const timestamp = message.createdAt ? new Date(message.createdAt) : null;
  const time =
    timestamp && !isNaN(timestamp)
      ? timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""} mb-3`}>
      {/* Avatar for other party */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
          {getInitials(roleLabel)}
        </div>
      )}

      <div className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {/* Role label */}
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-0.5 ml-1 capitalize">
          {roleLabel}
        </p>

        <div
          className={`rounded-2xl px-3.5 py-2 ${
            isOwn
              ? "bg-gradient-to-br from-[#0d9488] to-[#0891b2] text-white rounded-br-md"
              : "bg-white dark:bg-white/10 text-gray-800 dark:text-gray-200 shadow-sm ring-1 ring-gray-100 dark:ring-white/10 rounded-bl-md"
          }`}
        >
          <p className="text-[13px] leading-relaxed">{msgText}</p>
        </div>

        {time && (
          <p
            className={`text-[10px] mt-0.5 ${isOwn ? "text-right mr-1" : "ml-1"} text-gray-400 dark:text-gray-500`}
          >
            {time}
          </p>
        )}
      </div>
    </div>
  );
}
